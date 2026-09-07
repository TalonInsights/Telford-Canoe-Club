import { redirect } from 'next/navigation'
import { cache } from 'react'

import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Enums, Tables } from '@/lib/queries/helpers'

export type AppRole = Enums<'app_role'>
export type Profile = Tables<'profiles'>

const roleOrder: AppRole[] = ['registered', 'member', 'committee', 'admin']

export function roleAtLeast(role: AppRole | null | undefined, min: AppRole): boolean {
  if (!role) return false
  return roleOrder.indexOf(role) >= roleOrder.indexOf(min)
}

export type SessionInfo = {
  userId: string
  email: string
  profile: Profile
  isCurrentMember: boolean
}

/**
 * The signed-in auth user, verified with GoTrue ONCE per request. React's
 * `cache` dedupes every caller in the same render — the layout guard, the
 * page guard and each "my X" query — so a members page costs one auth round
 * trip instead of four.
 */
export const getAuthUser = cache(async () => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** Null when signed out (or while Supabase is unconfigured). Per-request cached. */
export const getSession = cache(async (): Promise<SessionInfo | null> => {
  const user = await getAuthUser()
  if (!user) return null
  const supabase = await createClient()

  const [{ data: profile }, { data: current }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.rpc('is_current_member', { uid: user.id }),
  ])
  if (!profile) return null
  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile,
    isCurrentMember: Boolean(current),
  }
})

/** §6 — layouts and every server action re-check on the server. */
export async function requireRole(min: AppRole): Promise<SessionInfo> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!roleAtLeast(session.profile.role, min)) redirect('/members')
  return session
}

/**
 * Members area gate: current paid membership, not just the role. A
 * registered-but-unpaid user is allowed exactly one page —
 * /members/membership — which shows tier choice (§4.3).
 */
export async function requireCurrentMember(): Promise<SessionInfo> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.isCurrentMember && !roleAtLeast(session.profile.role, 'committee')) {
    redirect('/members/membership')
  }
  return session
}
