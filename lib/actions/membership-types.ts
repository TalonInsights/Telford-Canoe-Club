'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * The membership catalogue. Admin-gated twice, here and by RLS, because these
 * records set what the club charges.
 *
 * Editing or switching off a type never touches anybody already on it: a
 * membership stamps its own price and end date when it is bought, so the past
 * stays the past.
 */

const typeSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Web name: lower-case letters, numbers and hyphens'),
  name: z.string().trim().min(2, 'Give the membership a name').max(80),
  description: z.string().trim().max(400).optional().nullable(),
  pricePence: z.number().int().min(0).max(100_000),
  durationMonths: z.number().int().min(1).max(60).nullable(),
  coversFamily: z.boolean(),
  legacyTier: z.enum(['adult', 'junior', 'family']),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
})

export type MembershipTypeInput = z.input<typeof typeSchema>

function revalidateTypes() {
  for (const path of ['/', '/join', '/welcome', '/admin/membership-types', '/admin/settings']) {
    revalidatePath(path)
  }
}

export async function saveMembershipTypeAction(input: MembershipTypeInput): Promise<ActionResult> {
  await requireRole('admin')
  const parsed = typeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data

  const supabase = await createClient()
  const row = {
    slug: v.slug,
    name: v.name,
    description: v.description || null,
    price_pence: v.pricePence,
    duration_months: v.durationMonths,
    covers_family: v.coversFamily,
    legacy_tier: v.legacyTier,
    is_active: v.isActive,
    sort_order: v.sortOrder,
  }

  const friendly = (code?: string, message?: string) =>
    code === '23505'
      ? 'Another membership already uses that web name'
      : (message ?? 'That did not save')

  if (v.id) {
    const { error } = await supabase.from('membership_types').update(row).eq('id', v.id)
    if (error) return { ok: false, message: friendly(error.code, error.message) }
    await supabase.rpc('audit', {
      p_action: 'membership_type.updated',
      p_entity: 'membership_types',
      p_entity_id: v.id,
      p_after: row,
    })
  } else {
    const { data, error } = await supabase
      .from('membership_types')
      .insert(row)
      .select('id')
      .single()
    if (error) return { ok: false, message: friendly(error.code, error.message) }
    await supabase.rpc('audit', {
      p_action: 'membership_type.created',
      p_entity: 'membership_types',
      p_entity_id: data.id,
      p_after: row,
    })
  }

  revalidateTypes()
  return { ok: true, message: v.id ? 'Membership saved' : 'Membership added' }
}

export async function deleteMembershipTypeAction(id: string): Promise<ActionResult> {
  await requireRole('admin')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown membership' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('membership_types')
    .select('name')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Not found' }

  const { error } = await supabase.from('membership_types').delete().eq('id', id)
  if (error) {
    // Somebody is on it, so the record has to stay for their history.
    return {
      ok: false,
      message:
        error.code === '23503'
          ? 'Somebody holds this membership, so it cannot be deleted. Switch it off instead.'
          : error.message,
    }
  }

  await supabase.rpc('audit', {
    p_action: 'membership_type.deleted',
    p_entity: 'membership_types',
    p_entity_id: id,
    p_before: { name: before.name },
  })
  revalidateTypes()
  return { ok: true, message: `${before.name} removed` }
}
