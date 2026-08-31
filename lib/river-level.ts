import 'server-only'

/**
 * Environment Agency real-time flood-monitoring API (open data, OGLv3).
 * Finds the Severn gauge by EA_STATION_REF, or by EA_STATION_SEARCH name
 * (Buildwas — the station just upstream of Jackfield; the EA station named
 * "Ironbridge" is on the River Dee and must never be used, see
 * docs/SPEC-VALIDATION.md §1.1). Responses cache for 15 minutes through
 * Next's fetch cache. Never throws — the status strip renders a fallback.
 */

export type RiverLevel = {
  stationName: string
  riverName: string
  levelMetres: number
  readingTime: string
  stationUrl: string
}

const API = 'https://environment.data.gov.uk/flood-monitoring'
const REVALIDATE = 900 // 15 minutes (§HOME brief)

type EAStation = {
  notation?: string
  label?: string
  riverName?: string
}

type EAReading = {
  value?: number
  dateTime?: string
}

async function eaFetch<T>(path: string): Promise<T | null> {
  try {
    // Hard per-call timeout: a hanging EA API once took the whole static
    // build down with it (three 60s prerender attempts). Never throw — and
    // never hang: the strip's fallback renders, and ISR retries in 15 min.
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getRiverLevel(): Promise<RiverLevel | null> {
  const ref = process.env.EA_STATION_REF?.trim()
  const search = process.env.EA_STATION_SEARCH?.trim() || 'Buildwas'

  let station: EAStation | null = null

  if (ref) {
    const data = await eaFetch<{ items?: EAStation | EAStation[] }>(
      `/id/stations/${encodeURIComponent(ref)}`
    )
    const item = data?.items
    station = Array.isArray(item) ? (item[0] ?? null) : (item ?? null)
  } else {
    const data = await eaFetch<{ items?: EAStation[] }>(
      `/id/stations?search=${encodeURIComponent(search)}&parameter=level`
    )
    station =
      data?.items?.find((s) => s.riverName === 'River Severn') ?? data?.items?.[0] ?? null
  }

  if (!station?.notation || !station.label) return null

  // The station document doesn't carry a reading — the sorted readings feed does.
  const readings = await eaFetch<{ items?: EAReading[] }>(
    `/id/stations/${encodeURIComponent(station.notation)}/readings?_sorted&_limit=1&parameter=level`
  )
  const latest = readings?.items?.[0]
  if (typeof latest?.value !== 'number' || !latest.dateTime) return null

  return {
    stationName: station.label,
    riverName: station.riverName ?? 'River Severn',
    levelMetres: latest.value,
    readingTime: latest.dateTime,
    stationUrl: `https://check-for-flooding.service.gov.uk/station/${station.notation}`,
  }
}
