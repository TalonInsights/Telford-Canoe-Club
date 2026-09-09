import { cache } from 'react'

import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * What the club sells. Records rather than hard-coded tiers, so the committee
 * can add something like a half-year membership without a deploy.
 *
 * `durationMonths` is the piece that used to be impossible: null keeps the
 * club's usual arrangement (runs to the end of the membership year), a number
 * means that many months from the day it is paid for. The database sets the
 * membership's own end date from it at activation (0028).
 */

export type MembershipType = {
  id: string
  slug: string
  name: string
  description: string | null
  pricePence: number
  durationMonths: number | null
  coversFamily: boolean
  legacyTier: 'adult' | 'junior' | 'family'
  isActive: boolean
  sortOrder: number
}

const COLUMNS =
  'id, slug, name, description, price_pence, duration_months, covers_family, legacy_tier, is_active, sort_order'

function toType(row: {
  id: string
  slug: string
  name: string
  description: string | null
  price_pence: number
  duration_months: number | null
  covers_family: boolean
  legacy_tier: string
  is_active: boolean
  sort_order: number
}): MembershipType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    pricePence: row.price_pence,
    durationMonths: row.duration_months,
    coversFamily: row.covers_family,
    legacyTier: row.legacy_tier as MembershipType['legacyTier'],
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

/** What a visitor can buy today. */
export const getMembershipTypes = cache(async (): Promise<MembershipType[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('membership_types')
    .select(COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(toType)
})

/** Everything, including what has been taken off sale. Admin screens only. */
export async function getAllMembershipTypes(): Promise<MembershipType[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('membership_types')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(toType)
}

/** How long a type lasts, in words. */
export function durationLabel(type: Pick<MembershipType, 'durationMonths'>): string {
  if (type.durationMonths === null) return 'Runs to the end of the membership year'
  if (type.durationMonths === 1) return 'One month from the day you pay'
  if (type.durationMonths === 12) return 'Twelve months from the day you pay'
  return `${type.durationMonths} months from the day you pay`
}
