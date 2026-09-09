import { getAuthUser } from '@/lib/auth/guards'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

/**
 * "Who is going to be on site." Row-level security decides what comes back:
 * nothing at all unless the committee has switched the feature on and the
 * reader holds a current membership, and never a session that has finished.
 *
 * The display name is built here, first name and last initial, so the table
 * itself never stores a name to leak.
 */

export type Checkin = {
  id: string
  userId: string
  startsAt: string
  endsAt: string
  note: string | null
  who: string
  isMine: boolean
}

function shortName(first: string | null, last: string | null): string {
  const firstName = (first ?? '').trim()
  const initial = (last ?? '').trim().charAt(0).toUpperCase()
  if (!firstName) return 'A member'
  return initial ? `${firstName} ${initial}` : firstName
}

/** The next seven days, soonest first. */
export async function getUpcomingCheckins(): Promise<Checkin[]> {
  if (!isSupabaseConfigured()) return []
  const user = await getAuthUser()

  const supabase = await createClient()
  const horizon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('member_checkins')
    .select('id, user_id, starts_at, ends_at, note')
    .lte('starts_at', horizon)
    .order('starts_at', { ascending: true })
  if (!data || data.length === 0) return []

  const { data: people } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name')
    .in('user_id', [...new Set(data.map((c) => c.user_id))])

  const names = new Map((people ?? []).map((p) => [p.user_id, shortName(p.first_name, p.last_name)]))

  return data
    // The policy already hides finished sessions, this drops the couple of
    // hours of grace it allows so the list only shows what is still ahead.
    .filter((c) => new Date(c.ends_at).getTime() > Date.now())
    .map((c) => ({
      id: c.id,
      userId: c.user_id,
      startsAt: c.starts_at,
      endsAt: c.ends_at,
      note: c.note,
      who: names.get(c.user_id) ?? 'A member',
      isMine: c.user_id === user?.id,
    }))
}
