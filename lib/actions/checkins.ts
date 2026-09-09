'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Posting a check-in IS the consent: there is no default, nothing automatic,
 * and no notification goes to anybody as a result. Removing one is a single
 * tap and takes effect immediately. Every rule is also enforced in the
 * database (0026), so this layer only has to give a member a clear sentence.
 */

const checkinSchema = z
  .object({
    startsAt: z.string().min(10),
    endsAt: z.string().min(10),
    note: z.string().trim().max(140).optional(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: 'The finish needs to be after the start',
    path: ['endsAt'],
  })

export async function postCheckinAction(
  input: z.input<typeof checkinSchema>
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }

  const parsed = checkinSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the times' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('post_checkin', {
    p_starts_at: new Date(parsed.data.startsAt).toISOString(),
    p_ends_at: new Date(parsed.data.endsAt).toISOString(),
    p_note: parsed.data.note || undefined,
  })
  if (error) return { ok: false, message: error.message }

  revalidatePath('/members/on-site')
  revalidatePath('/members')
  return { ok: true, message: 'Added. Other members can see you are going.' }
}

export async function removeCheckinAction(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown entry' }

  // The delete policy allows only your own row (or the committee), so this
  // needs no ownership check of its own.
  const supabase = await createClient()
  const { error } = await supabase.from('member_checkins').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  revalidatePath('/members/on-site')
  revalidatePath('/members')
  return { ok: true, message: 'Removed' }
}
