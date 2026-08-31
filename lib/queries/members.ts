import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type MembershipRow = Tables<'memberships'>
export type NoticeRow = Tables<'notices'>

export type MyMembership = MembershipRow & {
  periodLabel: string
  periodEndsOn: string
  covered: { display_name: string; is_junior: boolean }[]
}

export async function getMyMemberships(): Promise<MyMembership[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, membership_periods(label, ends_on), membership_members(display_name, is_junior)')
    .order('created_at', { ascending: false })
  return (memberships ?? []).map((m) => {
    const period = m.membership_periods as unknown as { label: string; ends_on: string } | null
    return {
      ...m,
      periodLabel: period?.label ?? '',
      periodEndsOn: period?.ends_on ?? '',
      covered: (m.membership_members as unknown as { display_name: string; is_junior: boolean }[]) ?? [],
    }
  })
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
