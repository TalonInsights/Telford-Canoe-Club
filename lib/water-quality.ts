import 'server-only'

/**
 * Environment Agency bathing water quality (open data, OGLv3) for the club's
 * own stretch: "River Severn at Ironbridge", designated in 2024, sampling
 * point 36070. One request to the bathing-water resource carries everything
 * the strip needs: the site name, the annual classification, and today's
 * short-term pollution risk prediction (refreshed each morning in season,
 * absent or stale outside it). Responses cache for 15 minutes through Next's
 * fetch cache. Never throws, the status strip renders a fallback cell.
 *
 * Client order 8 Sep 2026 (Simon): show this beside the site status and the
 * Buildwas gauge, linking to the EA profile page.
 */

export const BATHING_WATER_ID = 'ukg2100-36070'

export function bathingWaterProfileUrl(id: string = BATHING_WATER_ID): string {
  return `https://environment.data.gov.uk/bwq/profiles/profile.html?site=${encodeURIComponent(id)}`
}

export type WaterRiskLevel = 'normal' | 'increased' | 'unknown'

export type WaterQuality = {
  siteName: string
  /** Excellent, Good, Sufficient or Poor, the EA's rolling four-year rating. */
  classification: string | null
  classificationYear: string | null
  /** Live only while the prediction is in date; null once it expires. */
  riskLevel: WaterRiskLevel | null
  riskNote: string | null
  profileUrl: string
}

const API = 'https://environment.data.gov.uk'
const REVALIDATE = 900 // 15 minutes, matching the river gauge

type LangValue = { _value?: string }
type Named = { _about?: string; name?: LangValue }

type BathingWaterDoc = {
  result?: {
    primaryTopic?: {
      name?: LangValue
      latestComplianceAssessment?: { _about?: string; complianceClassification?: Named }
      latestRiskPrediction?: {
        riskLevel?: Named | string
        expiresAt?: LangValue
        comment?: LangValue
      }
    }
  }
}

function readRiskLevel(value: Named | string | undefined): WaterRiskLevel | null {
  const raw = typeof value === 'string' ? value : (value?.name?._value ?? value?._about)
  if (!raw) return null
  const slug = raw.split('/').pop()?.toLowerCase()
  if (slug === 'normal' || slug === 'increased' || slug === 'unknown') return slug
  return null
}

/**
 * The EA publishes `expiresAt` as a bare local timestamp. Parsing it without a
 * zone treats it as UTC on the server, which during BST expires the prediction
 * an hour early. That is the safe direction: a stale "no warning" is never
 * shown, the cell falls back to the classification instead.
 */
function isLive(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false
  const expiry = Date.parse(expiresAt.endsWith('Z') ? expiresAt : `${expiresAt}Z`)
  return Number.isFinite(expiry) && expiry > Date.now()
}

export async function getWaterQuality(): Promise<WaterQuality | null> {
  const id = process.env.EA_BATHING_WATER_ID?.trim() || BATHING_WATER_ID
  const profileUrl = bathingWaterProfileUrl(id)

  let doc: BathingWaterDoc | null = null
  try {
    // Same hard timeout rule as the river gauge: a hanging EA API must never
    // take a prerender down with it.
    const res = await fetch(`${API}/doc/bathing-water/${encodeURIComponent(id)}.json`, {
      next: { revalidate: REVALIDATE },
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    doc = (await res.json()) as BathingWaterDoc
  } catch {
    return null
  }

  const topic = doc?.result?.primaryTopic
  const siteName = topic?.name?._value
  if (!siteName) return null

  const assessment = topic?.latestComplianceAssessment
  const prediction = topic?.latestRiskPrediction
  const live = isLive(prediction?.expiresAt?._value)

  return {
    siteName,
    classification: assessment?.complianceClassification?.name?._value ?? null,
    classificationYear: assessment?._about?.match(/year\/(\d{4})/)?.[1] ?? null,
    riskLevel: live ? readRiskLevel(prediction?.riskLevel) : null,
    riskNote: live ? (prediction?.comment?._value ?? null) : null,
    profileUrl,
  }
}

/**
 * One place that turns the reading into the words on the strip. Today's
 * warning leads when there is one; otherwise the standing EA rating does, so
 * the cell always says something true about the water rather than nothing.
 */
export function describeWaterQuality(water: WaterQuality): {
  value: string
  detail: string
  warn: boolean
} {
  const rating = water.classification?.toLowerCase()
  const ratingLine = rating
    ? `EA rating: ${rating}${water.classificationYear ? `, ${water.classificationYear}` : ''}`
    : 'Environment Agency bathing water'

  if (water.riskLevel === 'increased') {
    return {
      value: 'Pollution warning',
      detail: water.riskNote ?? 'Short-term pollution risk today',
      warn: true,
    }
  }

  if (water.riskLevel === 'normal') {
    return { value: 'No warning today', detail: ratingLine, warn: false }
  }

  return {
    value: rating ? `Rated ${rating}` : 'See the EA rating',
    detail: water.classificationYear
      ? `EA bathing water, ${water.classificationYear} classification`
      : 'Environment Agency bathing water',
    warn: false,
  }
}
