import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * Membership years (periods). One row per year, exactly one marked current.
 * Public-readable; committee writes (0004). The admin "membership year" editor
 * reads this to let the club set when the year starts and ends — e.g. an April
 * to March year instead of the calendar one.
 */
export type MembershipPeriod = {
  id: string
  label: string
  startsOn: string
  endsOn: string
  isCurrent: boolean
}

export async function getMembershipPeriods(): Promise<MembershipPeriod[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('membership_periods')
    .select('id, label, starts_on, ends_on, is_current')
    .order('starts_on', { ascending: false })
  return (data ?? []).map((p) => ({
    id: p.id,
    label: p.label,
    startsOn: p.starts_on,
    endsOn: p.ends_on,
    isCurrent: p.is_current,
  }))
}
