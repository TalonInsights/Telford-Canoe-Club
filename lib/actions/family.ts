'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession } from '@/lib/auth/guards'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Add a child or other family member to a family membership after it was set
 * up (5.3). The authorisation — only the main member or the committee, only a
 * family membership — is enforced by `add_family_member()` in the database;
 * this validates the input and relays a friendly message.
 */

const schema = z.object({
  membershipId: z.uuid(),
  name: z.string().trim().min(2, 'Enter their name').max(120),
  dateOfBirth: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true
      const d = new Date(v)
      return !Number.isNaN(+d) && d < new Date() && d > new Date('1900-01-01')
    }, 'Enter a real date of birth')
    .optional(),
  emergencyName: z.string().trim().max(120).optional(),
  emergencyPhone: z.string().trim().max(30).optional(),
})

export type AddFamilyMemberInput = z.input<typeof schema>

function friendly(message: string): string {
  const m = message.replace(/^[A-Z0-9]+:\s*/, '')
  return m.charAt(0).toUpperCase() + m.slice(1)
}

export async function addFamilyMemberAction(input: AddFamilyMemberInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  const v = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc('add_family_member', {
    p_membership_id: v.membershipId,
    p_name: v.name,
    p_dob: v.dateOfBirth || undefined,
    p_emergency_name: v.emergencyName || undefined,
    p_emergency_phone: v.emergencyPhone || undefined,
  })
  if (error) return { ok: false, message: friendly(error.message) }

  revalidatePath('/members/membership')
  revalidatePath(`/admin/members/${session.userId}`)
  return { ok: true, message: `${v.name} added to your membership` }
}
