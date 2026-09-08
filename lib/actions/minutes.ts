'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { MINUTE_BLOCK_TYPES } from '@/lib/minutes/blocks'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * Committee minutes: written from the template, saved as blocks, published
 * when the committee is happy for members to read them. Drafts are invisible
 * to members at the database (0022), not merely hidden in the UI.
 */

const blockSchema = z.object({
  type: z.enum(MINUTE_BLOCK_TYPES),
  text: z.string().max(20_000),
})

const minutesSchema = z
  .object({
    // Minted by the page that opens the editor, so an attachment can be filed
    // under the right record before the record itself is saved.
    id: z.uuid(),
    meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the date of the meeting'),
    title: z.string().trim().min(3, 'Give these minutes a title').max(160),
    body: z.array(blockSchema).max(300),
    attachmentPath: z.string().max(300).nullable().optional(),
    attachmentName: z.string().max(200).nullable().optional(),
  })
  .refine(
    (v) => !v.attachmentPath || v.attachmentPath.startsWith(`minutes/${v.id}/`),
    { message: 'That file does not belong to these minutes', path: ['attachmentPath'] }
  )

export type MinutesInput = z.infer<typeof minutesSchema>

function revalidateMinutes(id?: string) {
  revalidatePath('/admin/minutes')
  revalidatePath('/members/minutes')
  revalidatePath('/members/documents')
  if (id) {
    revalidatePath(`/admin/minutes/${id}`)
    revalidatePath(`/members/minutes/${id}`)
  }
}

export async function saveMinutesAction(
  input: MinutesInput,
  options?: { publish?: boolean }
): Promise<ActionResult & { id?: string }> {
  const session = await requireRole('committee')
  const parsed = minutesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data
  const supabase = await createClient()

  const row = {
    meeting_date: v.meetingDate,
    title: v.title,
    body: v.body,
    attachment_path: v.attachmentPath ?? null,
    attachment_name: v.attachmentName ?? null,
    ...(options?.publish === undefined
      ? {}
      : options.publish
        ? { status: 'published', published_at: new Date().toISOString() }
        : { status: 'draft', published_at: null }),
  }

  const { data: existing } = await supabase
    .from('meeting_minutes')
    .select('id')
    .eq('id', v.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('meeting_minutes').update(row).eq('id', v.id)
    if (error) return { ok: false, message: error.message }
    await supabase.rpc('audit', {
      p_action: options?.publish ? 'minutes.published' : 'minutes.updated',
      p_entity: 'meeting_minutes',
      p_entity_id: v.id,
      p_after: { title: v.title, meeting_date: v.meetingDate },
    })
    revalidateMinutes(v.id)
    return {
      ok: true,
      id: v.id,
      message: options?.publish ? 'Minutes published to members' : 'Minutes saved',
    }
  }

  const { data, error } = await supabase
    .from('meeting_minutes')
    .insert({ ...row, id: v.id, created_by: session.userId })
    .select('id')
    .single()
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'minutes.created',
    p_entity: 'meeting_minutes',
    p_entity_id: data.id,
    p_after: { title: v.title, meeting_date: v.meetingDate, published: Boolean(options?.publish) },
  })
  revalidateMinutes(data.id)
  return {
    ok: true,
    id: data.id,
    message: options?.publish ? 'Minutes published to members' : 'Draft saved',
  }
}

export async function setMinutesStatusAction(input: {
  id: string
  status: 'draft' | 'published'
}): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(input.id).success) return { ok: false, message: 'Unknown minutes' }
  if (input.status !== 'draft' && input.status !== 'published') {
    return { ok: false, message: 'Unknown status' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('meeting_minutes')
    .update({
      status: input.status,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', input.id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: input.status === 'published' ? 'minutes.published' : 'minutes.unpublished',
    p_entity: 'meeting_minutes',
    p_entity_id: input.id,
    p_after: { status: input.status },
  })
  revalidateMinutes(input.id)
  return {
    ok: true,
    message:
      input.status === 'published'
        ? 'Published, members can read these now'
        : 'Back to a draft, members can no longer see these',
  }
}

export async function deleteMinutesAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown minutes' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('meeting_minutes')
    .select('title, meeting_date')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Minutes not found' }

  const { error } = await supabase.from('meeting_minutes').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'minutes.deleted',
    p_entity: 'meeting_minutes',
    p_entity_id: id,
    p_before: { title: before.title, meeting_date: before.meeting_date },
  })
  revalidateMinutes(id)
  return { ok: true, message: 'Minutes deleted' }
}
