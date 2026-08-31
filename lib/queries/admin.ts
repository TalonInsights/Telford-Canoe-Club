import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

/**
 * Committee/admin data access. All of these run as the signed-in committee
 * member through RLS — no service key involved. Pages calling these sit
 * behind requireRole('committee').
 */

export type DirectoryRow = {
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: string
  phone: string | null
  postcode: string | null
  bc_membership_number: string | null
  is_junior: boolean
  created_at: string
  membership_status: string
  tier: string | null
  paid_at: string | null
  membership_id: string | null
  amount_pence: number | null
  source: string | null
}

export async function getMembersDirectory(): Promise<DirectoryRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const [{ data: profiles }, { data: current }] = await Promise.all([
    supabase.from('profiles').select('*').is('deactivated_at', null).order('last_name'),
    supabase
      .from('memberships')
      .select('id, primary_user_id, status, tier, paid_at, amount_pence, source, membership_periods!inner(is_current), membership_members(user_id)')
      .eq('membership_periods.is_current', true),
  ])

  const byUser = new Map<string, NonNullable<typeof current>[number]>()
  for (const m of current ?? []) {
    const coveredIds = [
      m.primary_user_id,
      ...((m.membership_members as unknown as { user_id: string | null }[]) ?? [])
        .map((x) => x.user_id)
        .filter(Boolean),
    ] as string[]
    for (const uid of coveredIds) {
      const existing = byUser.get(uid)
      // An active row always beats a pending/cancelled one for display.
      if (!existing || (existing.status !== 'active' && m.status === 'active')) byUser.set(uid, m)
    }
  }

  return (profiles ?? []).map((p) => {
    const m = byUser.get(p.user_id)
    const dob = p.date_of_birth ? new Date(p.date_of_birth) : null
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 18)
    return {
      user_id: p.user_id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      role: p.role,
      phone: p.phone,
      postcode: p.postcode,
      bc_membership_number: p.bc_membership_number,
      is_junior: Boolean(dob && dob > cutoff),
      created_at: p.created_at,
      membership_status: m?.status ?? 'none',
      tier: m?.tier ?? null,
      paid_at: m?.paid_at ?? null,
      membership_id: m?.id ?? null,
      amount_pence: m?.amount_pence ?? null,
      source: m?.source ?? null,
    }
  })
}

export type MemberDetail = {
  profile: Tables<'profiles'>
  memberships: (Tables<'memberships'> & { periodLabel: string; covered: string[] })[]
  bookings: (Tables<'event_bookings'> & { eventTitle: string | null })[]
}

export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const [{ data: profile }, { data: memberships }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('memberships')
      .select('*, membership_periods(label), membership_members(display_name)')
      .eq('primary_user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_bookings')
      .select('*, events(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])
  if (!profile) return null
  return {
    profile,
    memberships: (memberships ?? []).map((m) => ({
      ...m,
      periodLabel: (m.membership_periods as unknown as { label: string } | null)?.label ?? '',
      covered: ((m.membership_members as unknown as { display_name: string }[]) ?? []).map(
        (x) => x.display_name
      ),
    })),
    bookings: (bookings ?? []).map((b) => ({
      ...b,
      eventTitle: (b.events as unknown as { title: string } | null)?.title ?? null,
    })),
  }
}

export type AdminStats = {
  activeByTier: Record<string, number>
  activeTotal: number
  pending: number
  registeredNeverPaid: number
  upcomingEvents: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const empty = { activeByTier: {}, activeTotal: 0, pending: 0, registeredNeverPaid: 0, upcomingEvents: 0 }
  if (!isSupabaseConfigured()) return empty
  const supabase = await createClient()
  const [{ data: current }, { count: profileCount }, { count: eventCount }] = await Promise.all([
    supabase
      .from('memberships')
      .select('status, tier, primary_user_id, membership_periods!inner(is_current)')
      .eq('membership_periods.is_current', true),
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).is('deactivated_at', null),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('starts_at', new Date().toISOString()),
  ])
  const active = (current ?? []).filter((m) => m.status === 'active')
  const activeByTier: Record<string, number> = {}
  for (const m of active) activeByTier[m.tier] = (activeByTier[m.tier] ?? 0) + 1
  const withAny = new Set((current ?? []).map((m) => m.primary_user_id))
  return {
    activeByTier,
    activeTotal: active.length,
    pending: (current ?? []).filter((m) => m.status === 'pending').length,
    registeredNeverPaid: Math.max(0, (profileCount ?? 0) - withAny.size),
    upcomingEvents: eventCount ?? 0,
  }
}

export async function getAuditLog(limit = 100) {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
