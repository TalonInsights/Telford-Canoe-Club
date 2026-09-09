'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * The river guidance bands the committee edits. Stored in centimetres; either
 * end may be empty so the ladder can be open at the bottom and the top.
 * Overlaps and gaps are reported to the editor rather than refused, because a
 * deliberate gap is the club's business, not ours.
 */

const bandSchema = z
  .object({
    id: z.uuid().optional(),
    minCm: z.number().int().min(0).max(2000).nullable(),
    maxCm: z.number().int().min(0).max(2000).nullable(),
    label: z.string().trim().min(2, 'Give the band a label').max(80),
    description: z.string().trim().max(400).optional().nullable(),
    sortOrder: z.number().int().min(0).max(999).default(0),
  })
  .refine((v) => v.minCm !== null || v.maxCm !== null, {
    message: 'A band needs a level at one end at least',
    path: ['minCm'],
  })
  .refine((v) => v.minCm === null || v.maxCm === null || v.maxCm > v.minCm, {
    message: 'The upper level must be above the lower one',
    path: ['maxCm'],
  })

export type RiverBandInput = z.input<typeof bandSchema>

function revalidateBands() {
  revalidatePath('/')
  revalidatePath('/venue/river-levels')
  revalidatePath('/admin/river-levels')
}

export async function saveRiverBandAction(input: RiverBandInput): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = bandSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the band' }
  }
  const v = parsed.data

  const supabase = await createClient()
  const row = {
    min_cm: v.minCm,
    max_cm: v.maxCm,
    label: v.label,
    description: v.description || null,
    sort_order: v.sortOrder,
  }

  if (v.id) {
    const { error } = await supabase.from('river_level_bands').update(row).eq('id', v.id)
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'river_band.updated',
      p_entity: 'river_level_bands',
      p_entity_id: v.id,
      p_after: row,
    })
  } else {
    const { data, error } = await supabase
      .from('river_level_bands')
      .insert(row)
      .select('id')
      .single()
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'river_band.created',
      p_entity: 'river_level_bands',
      p_entity_id: data.id,
      p_after: row,
    })
  }

  revalidateBands()
  return { ok: true, message: v.id ? 'Band saved' : 'Band added' }
}

export async function deleteRiverBandAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown band' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('river_level_bands')
    .select('label')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Band not found' }

  const { error } = await supabase.from('river_level_bands').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'river_band.deleted',
    p_entity: 'river_level_bands',
    p_entity_id: id,
    p_before: { label: before.label },
  })
  revalidateBands()
  return { ok: true, message: `${before.label} removed` }
}
