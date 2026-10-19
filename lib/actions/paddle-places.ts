'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { isPlacePhotoPath } from '@/lib/storage/site-images'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * "Where we paddle", managed by the committee. Admin-gated here and by RLS.
 * Links are a short list of {label, url}; the photo is recorded separately
 * (the file is uploaded from the browser first), with a path guard so a saved
 * path can only point at this place's own folder.
 */

const linkSchema = z.object({
  label: z.string().trim().min(1, 'Give the link a label').max(80),
  url: z.union([z.url(), z.literal('')]).transform((v) => v || ''),
})

const placeSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, 'Name the place').max(120),
  category: z.enum(['artificial', 'natural']),
  description: z.string().trim().max(2000).optional().default(''),
  links: z.array(linkSchema).max(6).default([]),
  isPublished: z.boolean(),
})

export type PaddlePlaceInput = z.input<typeof placeSchema>

function revalidatePlaces() {
  revalidatePath('/admin/where-we-paddle')
  revalidatePath('/paddlesports')
}

export async function savePlaceAction(input: PaddlePlaceInput): Promise<ActionResult & { id?: string }> {
  await requireRole('committee')
  const parsed = placeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  const v = parsed.data
  // Drop links whose url is empty — a label with no address is not a link.
  const links = v.links.filter((l) => l.url)
  const supabase = await createClient()

  const row = {
    name: v.name,
    category: v.category,
    description: v.description ?? '',
    links,
    is_published: v.isPublished,
  }

  if (v.id) {
    const { error } = await supabase.from('paddle_places').update(row).eq('id', v.id)
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'place.updated',
      p_entity: 'paddle_places',
      p_entity_id: v.id,
      p_after: { name: v.name, category: v.category, is_published: v.isPublished },
    })
    revalidatePlaces()
    return { ok: true, id: v.id, message: 'Place saved' }
  }

  const { data: last } = await supabase
    .from('paddle_places')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (last?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('paddle_places')
    .insert({ ...row, sort_order: sortOrder })
    .select('id')
    .single()
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'place.created',
    p_entity: 'paddle_places',
    p_entity_id: data.id,
    p_after: { name: v.name, category: v.category },
  })
  revalidatePlaces()
  return { ok: true, id: data.id, message: 'Place added' }
}

export async function deletePlaceAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown place' }
  const supabase = await createClient()
  const { data: before } = await supabase.from('paddle_places').select('name').eq('id', id).maybeSingle()
  if (!before) return { ok: false, message: 'Not found' }
  const { error } = await supabase.from('paddle_places').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'place.deleted',
    p_entity: 'paddle_places',
    p_entity_id: id,
    p_before: { name: before.name },
  })
  revalidatePlaces()
  return { ok: true, message: 'Place removed' }
}

export async function reorderPlacesAction(ids: string[]): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = z.array(z.uuid()).max(200).safeParse(ids)
  if (!parsed.success) return { ok: false, message: 'Invalid order' }
  const supabase = await createClient()
  for (let i = 0; i < parsed.data.length; i++) {
    const { error } = await supabase.from('paddle_places').update({ sort_order: i + 1 }).eq('id', parsed.data[i])
    if (error) return { ok: false, message: error.message }
  }
  revalidatePlaces()
  return { ok: true, message: 'Order saved' }
}

const photoSchema = z
  .object({ id: z.uuid(), photoPath: z.string().max(200).nullable() })
  .refine((v) => v.photoPath === null || isPlacePhotoPath(v.id, v.photoPath), {
    message: 'Unexpected photo path',
    path: ['photoPath'],
  })

export async function setPlacePhotoAction(
  input: z.input<typeof photoSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = photoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the photo' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('paddle_places')
    .update({ photo_path: parsed.data.photoPath })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: parsed.data.photoPath ? 'place.photo_updated' : 'place.photo_removed',
    p_entity: 'paddle_places',
    p_entity_id: parsed.data.id,
    p_after: { photo_path: parsed.data.photoPath },
  })
  revalidatePlaces()
  return { ok: true, message: parsed.data.photoPath ? 'Photo saved' : 'Photo removed' }
}
