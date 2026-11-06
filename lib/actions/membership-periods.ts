'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * The membership year (period) editor. Committee-gated twice, here and by RLS
 * (0004). This is how the club sets when the membership year starts and ends —
 * for example an April-to-March year rather than the calendar one — without a
 * developer. A membership stamps its own end date when it is paid for, so
 * changing a year here never rewrites what someone already bought; it governs
 * what the join page says and when renewals open.
 */

const periodSchema = z
  .object({
    id: z.uuid().optional(),
    label: z.string().trim().min(2, 'Give the year a name, e.g. 2027 or 2026/27').max(20),
    startsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date'),
    endsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick an end date'),
  })
  .refine((v) => v.endsOn > v.startsOn, { message: 'The end date must be after the start', path: ['endsOn'] })

export type PeriodInput = z.input<typeof periodSchema>

function revalidateYear() {
  for (const path of [
    '/',
    '/join',
    '/welcome',
    '/members/membership',
    '/admin/membership-types',
    '/admin/settings',
  ]) {
    revalidatePath(path)
  }
}

export async function saveMembershipPeriodAction(input: PeriodInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  await requireRole('committee')
  const parsed = periodSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the dates' }
  }
  const v = parsed.data
  const supabase = await createClient()
  const row = { label: v.label, starts_on: v.startsOn, ends_on: v.endsOn }

  if (v.id) {
    const { error } = await supabase.from('membership_periods').update(row).eq('id', v.id)
    if (error) {
      return {
        ok: false,
        message: error.code === '23505' ? 'Another year already uses that name' : error.message,
      }
    }
    await supabase.rpc('audit', {
      p_action: 'membership.period_updated',
      p_entity: 'membership_periods',
      p_entity_id: v.id,
      p_after: row,
    })
  } else {
    const { data, error } = await supabase
      .from('membership_periods')
      .insert(row)
      .select('id')
      .single()
    if (error) {
      return {
        ok: false,
        message: error.code === '23505' ? 'Another year already uses that name' : error.message,
      }
    }
    await supabase.rpc('audit', {
      p_action: 'membership.period_created',
      p_entity: 'membership_periods',
      p_entity_id: data.id,
      p_after: row,
    })
  }

  revalidateYear()
  return { ok: true, message: v.id ? 'Year updated' : 'Year added' }
}

export async function setCurrentPeriodAction(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown year' }

  const supabase = await createClient()
  // Exactly one row may be current (a partial unique index enforces it), so the
  // old current is cleared before the new one is set.
  const { error: clearError } = await supabase
    .from('membership_periods')
    .update({ is_current: false })
    .eq('is_current', true)
  if (clearError) return { ok: false, message: clearError.message }

  const { error } = await supabase
    .from('membership_periods')
    .update({ is_current: true })
    .eq('id', id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'membership.period_made_current',
    p_entity: 'membership_periods',
    p_entity_id: id,
    p_after: { is_current: true },
  })

  revalidateYear()
  return { ok: true, message: 'Current year updated' }
}
