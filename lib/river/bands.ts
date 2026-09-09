/**
 * Turning a gauge reading into something a paddler can act on.
 *
 * The Environment Agency publishes metres; the club talks in centimetres
 * ("under 50", "over 200"), so bands are stored as whole centimetres and every
 * screen that shows one also shows the metres it came from. Either end of a
 * band may be open, which is how "under 50" and "over 200" are expressed.
 *
 * Safe on the server and in the browser.
 */

export type RiverBand = {
  id: string
  minCm: number | null
  maxCm: number | null
  label: string
  description: string | null
  sortOrder: number
}

export function metresToCm(metres: number): number {
  return Math.round(metres * 100)
}

/** Bands are half-open: a reading equal to `maxCm` belongs to the next band up. */
export function bandContains(band: RiverBand, cm: number): boolean {
  if (band.minCm !== null && cm < band.minCm) return false
  if (band.maxCm !== null && cm >= band.maxCm) return false
  return true
}

/**
 * The band a reading falls in, lowest first so an overlap resolves the same
 * way every time rather than depending on row order. Null when the committee
 * has defined no band that covers this reading, which the caller must show as
 * "no guidance for this level" rather than inventing one.
 */
export function matchBand(bands: RiverBand[], cm: number): RiverBand | null {
  return [...bands].sort(byLowerEdge).find((band) => bandContains(band, cm)) ?? null
}

function lowerEdge(band: RiverBand): number {
  return band.minCm ?? Number.NEGATIVE_INFINITY
}

function byLowerEdge(a: RiverBand, b: RiverBand): number {
  return lowerEdge(a) - lowerEdge(b) || a.sortOrder - b.sortOrder
}

export type BandProblem = {
  kind: 'overlap' | 'gap' | 'open-bottom' | 'open-top' | 'duplicate-open-end'
  message: string
}

/**
 * What is wrong with the ladder, in words. Deliberately warnings and not
 * errors: a club that wants a deliberate gap should be allowed one, and the
 * request asks to warn rather than silently accept.
 */
export function checkBands(bands: RiverBand[]): BandProblem[] {
  if (bands.length === 0) return []
  const problems: BandProblem[] = []
  const sorted = [...bands].sort(byLowerEdge)

  const openBottom = sorted.filter((b) => b.minCm === null)
  const openTop = sorted.filter((b) => b.maxCm === null)

  if (openBottom.length === 0) {
    problems.push({
      kind: 'open-bottom',
      message: `Nothing covers a reading below ${sorted[0].minCm} cm. Leave the lowest band's "from" empty so it catches everything under it.`,
    })
  }
  if (openTop.length === 0) {
    const highest = sorted[sorted.length - 1]
    problems.push({
      kind: 'open-top',
      message: `Nothing covers a reading above ${highest.maxCm} cm. Leave the highest band's "to" empty so it catches everything over it.`,
    })
  }
  if (openBottom.length > 1) {
    problems.push({
      kind: 'duplicate-open-end',
      message: `${openBottom.length} bands are open at the bottom. Only the lowest one should be.`,
    })
  }
  if (openTop.length > 1) {
    problems.push({
      kind: 'duplicate-open-end',
      message: `${openTop.length} bands are open at the top. Only the highest one should be.`,
    })
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const lower = sorted[i]
    const upper = sorted[i + 1]
    if (lower.maxCm === null || upper.minCm === null) continue

    if (upper.minCm < lower.maxCm) {
      problems.push({
        kind: 'overlap',
        message: `"${lower.label}" and "${upper.label}" overlap between ${upper.minCm} and ${lower.maxCm} cm. A reading in there could read either way.`,
      })
    } else if (upper.minCm > lower.maxCm) {
      problems.push({
        kind: 'gap',
        message: `Nothing covers ${lower.maxCm} to ${upper.minCm} cm, between "${lower.label}" and "${upper.label}".`,
      })
    }
  }

  return problems
}

/** How a band's range reads on screen, in the club's own words. */
export function bandRangeLabel(band: RiverBand): string {
  if (band.minCm === null && band.maxCm !== null) return `Under ${band.maxCm} cm`
  if (band.maxCm === null && band.minCm !== null) return `${band.minCm} cm and above`
  return `${band.minCm} to ${band.maxCm} cm`
}

/** The reading itself, in both units, because the gauge and the club differ. */
export function readingLabel(metres: number): string {
  return `${metres.toFixed(2)} m (${metresToCm(metres)} cm)`
}
