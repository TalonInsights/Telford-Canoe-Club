'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

const roleSchema = z.object({
  id: z.uuid().optional(),
  roleTitle: z.string().trim().min(2, 'Give the role a title').max(80),
  holderDisplayName: z.string().trim().max(120).optional(),
  contactEmail: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
  description: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(999),
})

export type CommitteeRoleInput = z.infer<typeof roleSchema>

/** P9-09 — create/update a committee role (drives the public committee page). */
export async function upsertCommitteeRoleAction(input: CommitteeRoleInput): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = roleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }

  const supabase = await createClient()
  const row = {
    role_title: parsed.data.roleTitle,
    holder_display_name: parsed.data.holderDisplayName || null,
    contact_email: parsed.data.contactEmail || null,
    description: parsed.data.description || null,
    sort_order: parsed.data.sortOrder,
  }

  if (parsed.data.id) {
    const { error } = await supabase.from('committee_roles').update(row).eq('id', parsed.data.id)
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'committee.role_updated',
      p_entity: 'committee_roles',
      p_entity_id: parsed.data.id,
      p_after: row,
    })
  } else {
    const { data, error } = await supabase.from('committee_roles').insert(row).select('id').single()
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: 'committee.role_created',
      p_entity: 'committee_roles',
      p_entity_id: data.id,
      p_after: row,
    })
  }

  revalidatePath('/about/committee')
  revalidatePath('/admin/committee')
  return { ok: true, message: 'Committee updated' }
}

export async function deleteCommitteeRoleAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Invalid role' }
  const supabase = await createClient()
  const { data: before } = await supabase
    .from('committee_roles')
    .select('role_title')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Role not found' }
  const { error } = await supabase.from('committee_roles').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'committee.role_deleted',
    p_entity: 'committee_roles',
    p_entity_id: id,
    p_before: { role_title: before.role_title },
  })
  revalidatePath('/about/committee')
  revalidatePath('/admin/committee')
  return { ok: true, message: 'Role removed' }
}

const photoSchema = z
  .object({
    id: z.uuid(),
    photoPath: z.string().max(200).nullable(),
  })
  .refine(
    (v) =>
      v.photoPath === null ||
      new RegExp(`^committee/${v.id}/photo-\d+\.[a-z0-9]{2,5}$`).test(v.photoPath),
    { message: 'Unexpected photo path', path: ['photoPath'] }
  )

export type CommitteeRolePhotoInput = z.infer<typeof photoSchema>

/**
 * Set or clear the photo shown beside a committee name (0021). The file is
 * already in `site-images`, uploaded from the browser under the committee
 * member's own session (bucket policies 0016); this records which object the
 * role shows and audits the change.
 */
export async function setCommitteeRolePhotoAction(
  input: CommitteeRolePhotoInput
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = photoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the photo' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('committee_roles')
    .select('photo_path')
    .eq('id', parsed.data.id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Role not found' }

  const { error } = await supabase
    .from('committee_roles')
    .update({ photo_path: parsed.data.photoPath })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: parsed.data.photoPath ? 'committee.photo_updated' : 'committee.photo_removed',
    p_entity: 'committee_roles',
    p_entity_id: parsed.data.id,
    p_before: { photo_path: before.photo_path },
    p_after: { photo_path: parsed.data.photoPath },
  })

  revalidatePath('/about/committee')
  revalidatePath('/admin/committee')
  return { ok: true, message: parsed.data.photoPath ? 'Photo saved' : 'Photo removed' }
}
