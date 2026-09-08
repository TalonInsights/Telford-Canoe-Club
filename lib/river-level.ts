import 'server-only'

import { lastGoodStore } from '@/lib/last-good'

/**
 * Environment Agency real-time flood-monitoring API (open data, OGLv3).
 *
 * The gauge is Buildwas, station 2134, the one just upstream of Jackfield. The
 * EA station named "Ironbridge" is on the River Dee and must never be used
 * (docs/SPEC-VALIDATION.md §1.1). `EA_STATION_REF` or `EA_STATION_SEARCH`
 * override it.
 *
 * Two things this module is careful about, both learned the hard way:
 *
 * 1. It reads a window of readings, not just the newest one, so the strip can
 *    say whether the river is rising or falling (client order 8 Sep 2026).
 * 2. It makes ONE request on the default path. The station document is only
 *    needed for the gauge's name, which we already know, and the name search
 *    is the slowest call of the lot. This API is a beta service that regularly
 *    takes six to twenty seconds, so every avoidable round trip was a real
 *    chance of the cell reading "Level unavailable".
 *
 * Never throws and never hangs: a hard timeout, a last-known-good cushion, and
 * a null return the status strip renders a fallback for.
 */

export type RiverTrend = 'rising' | 'falling' | 'steady'

export type RiverLevel = {
  stationName: string
  riverName: string
  levelMetres: number
  readingTime: string
  stationUrl: string
  /** How the gauge has moved across the window; null if it returned one reading. */
  trend: RiverTrend | null
  /** Signed change in metres across the window, positive when rising. */
  changeMetres: number | null
  /** Hours actually covered by the readings, so a gap never reads as three hours. */
  windowHours: number | null
}

const API = 'https://environment.data.gov.uk/flood-monitoring'
const REVALIDATE = 600 // 10 minutes (client order 8 Sep 2026); the gauge publishes every 15

/**
 * Long enough to ride out the EA's usual slow spell, short enough that no
 * page render is held hostage. Measured 8 Sep 2026: this API answered in
 * anywhere from 4 to 26 seconds, so a timeout is a when, not an if, and the
 * last-known-good reading below is what actually keeps the cell populated.
 */
const TIMEOUT_MS = 8000

/** 15-minute readings, so 13 covers the last three hours. */
const WINDOW_READINGS = 13

/**
 * The gauge jitters by a few millimetres between readings even on flat water
 * (Buildwas sat between 0.372 and 0.376 all one afternoon). A centimetre
 * across the window is above that noise and below anything a paddler would
 * call a change, so it is the line between "steady" and a real rise or fall.
 */
const TREND_THRESHOLD_METRES = 0.01

const DEFAULT_STATION = {
  ref: '2134',
  label: 'Buildwas',
  riverName: 'River Severn',
}

/** Six hours: still recognisably "today's river", and every cell shows its own timestamp. */
const lastGood = lastGoodStore<RiverLevel>(6 * 60 * 60 * 1000)

type EAStation = {
  notation?: string
  label?: string
  riverName?: string
}

type EAReading = {
  value?: number
  dateTime?: string
  measure?: string
}

async function eaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

type ResolvedStation = { ref: string; label?: string; riverName?: string }

/**
 * The station to read. The default costs nothing: we already know which gauge
 * this is. Only a configured name search pays for a lookup.
 */
async function resolveStation(): Promise<ResolvedStation | null> {
  const ref = process.env.EA_STATION_REF?.trim()
  if (ref) return { ref }

  const search = process.env.EA_STATION_SEARCH?.trim()
  if (!search) return DEFAULT_STATION

  const data = await eaFetch<{ items?: EAStation[] }>(
    `/id/stations?search=${encodeURIComponent(search)}&parameter=level`
  )
  const station =
    data?.items?.find((s) => s.riverName === 'River Severn') ?? data?.items?.[0] ?? null
  if (!station?.notation) return null
  return { ref: station.notation, label: station.label, riverName: station.riverName }
}

export async function getRiverLevel(): Promise<RiverLevel | null> {
  const station = await resolveStation()
  if (!station) return lastGood.recall()

  // The readings feed carries no station name, so when we don't already have
  // one the station document is fetched alongside rather than before it: one
  // round trip of latency instead of two.
  const [readings, doc] = await Promise.all([
    eaFetch<{ items?: EAReading[] }>(
      `/id/stations/${encodeURIComponent(station.ref)}/readings?_sorted&_limit=${WINDOW_READINGS}&parameter=level`
    ),
    station.label
      ? Promise.resolve(null)
      : eaFetch<{ items?: EAStation | EAStation[] }>(
          `/id/stations/${encodeURIComponent(station.ref)}`
        ),
  ])

  const latest = readings?.items?.[0]
  if (typeof latest?.value !== 'number' || !latest.dateTime) return lastGood.recall()

  const described = Array.isArray(doc?.items) ? doc?.items?.[0] : doc?.items

  // A station can publish more than one level measure (upstream and downstream
  // stage, say). Comparing across measures would invent a trend, so the window
  // is limited to the measure the newest reading came from.
  const series = (readings?.items ?? [])
    .filter(
      (r): r is EAReading & { value: number; dateTime: string } =>
        typeof r.value === 'number' &&
        typeof r.dateTime === 'string' &&
        r.measure === latest.measure
    )
    .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime))

  const oldest = series.at(-1)
  const windowMs = oldest ? Date.parse(latest.dateTime) - Date.parse(oldest.dateTime) : 0
  const windowHours = windowMs >= 3_600_000 ? windowMs / 3_600_000 : null
  const changeMetres = windowHours && oldest ? latest.value - oldest.value : null

  return lastGood.remember({
    stationName: station.label ?? described?.label ?? DEFAULT_STATION.label,
    riverName: station.riverName ?? described?.riverName ?? DEFAULT_STATION.riverName,
    levelMetres: latest.value,
    readingTime: latest.dateTime,
    stationUrl: `https://check-for-flooding.service.gov.uk/station/${station.ref}`,
    trend:
      changeMetres === null
        ? null
        : Math.abs(changeMetres) < TREND_THRESHOLD_METRES
          ? 'steady'
          : changeMetres > 0
            ? 'rising'
            : 'falling',
    changeMetres,
    windowHours,
  })
}

/**
 * The words for the "Rapid today" cell. Movement only, never a verdict on
 * whether the rapid is runnable: the club has not set the level bands that
 * would make that call (D15). Null when the gauge gave too short a window,
 * and the cell falls back to its plain link.
 */
export function describeRiverTrend(
  level: RiverLevel
): { trend: RiverTrend; value: string; detail: string } | null {
  if (!level.trend || level.changeMetres === null || !level.windowHours) return null

  const hours = Math.round(level.windowHours)
  const span = hours <= 1 ? 'the last hour' : `the last ${hours} hours`
  const size = Math.abs(level.changeMetres).toFixed(2)

  if (level.trend === 'rising') {
    return { trend: 'rising', value: 'Rising', detail: `Up ${size} m over ${span}` }
  }
  if (level.trend === 'falling') {
    return { trend: 'falling', value: 'Falling', detail: `Down ${size} m over ${span}` }
  }
  return { trend: 'steady', value: 'Steady', detail: `Little change over ${span}` }
}
