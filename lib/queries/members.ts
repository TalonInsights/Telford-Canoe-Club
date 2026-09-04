import type { CoveredMember } from '@/lib/membership/family'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type MembershipRow = Tables<'memberships'>
export type NoticeRow = Tables<'notices'>

export type MyMembership = MembershipRow & {
  periodLabel: string
  periodEndsOn: string
  covered: CoveredMember[]
}

export async function getMyMemberships(): Promise<MyMembership[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, membership_periods(label, ends_on), membership_members(*)')
    .order('created_at', { ascending: false })
  return (memberships ?? []).map((m) => {
    const period = m.membership_periods as unknown as { label: string; ends_on: string } | null
    return {
      ...m,
      periodLabel: period?.label ?? '',
      periodEndsOn: period?.ends_on ?? '',
      covered: (m.membership_members as unknown as CoveredMember[]) ?? [],
    }
  })
}

export type RenewalOffer = {
  /** The period after the current one (null until the committee creates it). */
  nextPeriod: { id: string; label: string } | null
  /** Date the current period ends (ISO), for the "expires in N days" state. */
  currentEndsOn: string | null
  daysLeft: number | null
  /** True when renewal should be offered: next period exists and ≤60 days remain (or ended). */
  open: boolean
}

/** P4-05 — the renew button's brain. */
export async function getRenewalOffer(): Promise<RenewalOffer> {
  const closed: RenewalOffer = { nextPeriod: null, currentEndsOn: null, daysLeft: null, open: false }
  if (!isSupabaseConfigured()) return closed
  const supabase = await createClient()
  const { data: periods } = await supabase
    .from('membership_periods')
    .select('id, label, starts_on, ends_on, is_current')
    .order('starts_on', { ascending: true })
  if (!periods?.length) return closed
  const current = periods.find((p) => p.is_current)
  if (!current) return closed
  const next = periods.find((p) => p.starts_on > current.ends_on) ?? null
  const endsOn = new Date(`${current.ends_on}T23:59:59Z`)
  const daysLeft = Math.ceil((endsOn.getTime() - Date.now()) / 86_400_000)
  return {
    nextPeriod: next ? { id: next.id, label: next.label } : null,
    currentEndsOn: current.ends_on,
    daysLeft,
    open: Boolean(next) && daysLeft <= 60,
  }
}

export async function getCurrentPeriodLabel(): Promise<string> {
  if (!isSupabaseConfigured()) return '2026'
  const supabase = await createClient()
  const { data } = await supabase
    .from('membership_periods')
    .select('label')
    .eq('is_current', true)
    .maybeSingle()
  return data?.label ?? '2026'
}

export type MyBooking = Tables<'event_bookings'> & {
  event: Pick<Tables<'events'>, 'slug' | 'title' | 'starts_at' | 'ends_at' | 'location_name'> | null
}

export async function getMyBookings(): Promise<MyBooking[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_bookings')
    .select('*, events(slug, title, starts_at, ends_at, location_name)')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
  return (data ?? []).map((b) => ({
    ...b,
    event: (b.events as unknown as MyBooking['event']) ?? null,
  }))
}

export async function getMemberNotices(): Promise<NoticeRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('notices')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  return data ?? []
}
