'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { appRoles, roleLabels } from '@/lib/auth/roles'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Who can do what on the site. The club runs its own admins from here rather
 * than asking us, which is the point of it.
 *
 * The real decisions live in `set_user_role()` (0030), not in this file: admin
 * only, never your own role, never the last admin, always audited. This layer
 * checks the same things early so the person gets a sentence instead of a
 * database error, and turns whatever the database says back into a sentence if
 * it refuses anyway.
 */

const schema = z.object({
  userId: z.uuid(),
  role: z.enum(appRoles),
})

export type SetUserRoleInput = z.input<typeof schema>

/** Postgres messages are already written for a human; the rest are not. */
function explain(message: string): string {
  const known = [
    'only admins can change roles',
    'you cannot change your own role, ask the other admin to do it',
    'that would leave the club with no admin',
    'no such person',
  ]
  const hit = known.find((k) => message.includes(k))
  if (!hit) return 'That role change did not go through'
  return hit.charAt(0).toUpperCase() + hit.slice(1)
}

export async function setUserRoleAction(input: SetUserRoleInput): Promise<ActionResult> {
  const session = await requireRole('admin')
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: 'Choose a role' }
  }
  const { userId, role } = parsed.data

  if (userId === session.userId) {
    return { ok: false, message: 'You cannot change your own role, ask the other admin to do it' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_user_role', { target: userId, new_role: role })
  if (error) return { ok: false, message: explain(error.message) }

  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${userId}`)
  return { ok: true, message: `Role set to ${roleLabels[role].toLowerCase()}` }
}
