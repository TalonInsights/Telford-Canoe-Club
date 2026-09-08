'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { documentCategories } from '@/lib/storage/documents'
import type { ActionResult } from '@/lib/actions/auth'

/**
 * The club's document store: public paperwork, the members' library, and the
 * committee's own records (bookings, council contacts, inventory).
 *
 * The file itself goes browser → storage under the committee member's own
 * session, into the bucket that matches the visibility. This action records
 * where it went. `visibility` is therefore not decoration: it decides which
 * bucket policy guards the file, so it is validated here and the path is
 * checked to belong to the row it claims to.
 */

const documentSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2, 'Give the document a title').max(160),
  category: z.enum(documentCategories),
  visibility: z.enum(['public', 'members', 'committee']),
  storagePath: z.string().min(3).max(300),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(160),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  versionLabel: z.string().trim().max(60).optional().nullable(),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  reviewDue: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).max(999).default(0),
})

export type DocumentInput = z.input<typeof documentSchema>

function revalidateDocuments() {
  revalidatePath('/admin/documents')
  revalidatePath('/members/documents')
  revalidatePath('/about/policies')
}

export async function saveDocumentAction(input: DocumentInput): Promise<ActionResult> {
  const session = await requireRole('committee')
  const parsed = documentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data

  // The path is minted from the row id; anything else means a caller trying to
  // point a row at somebody else's file.
  if (!v.storagePath.startsWith(`${v.id}/`)) {
    return { ok: false, message: 'That file does not belong to this document' }
  }

  const supabase = await createClient()
  const row = {
    id: v.id,
    title: v.title,
    category: v.category,
    visibility: v.visibility,
    storage_path: v.storagePath,
    file_name: v.fileName,
    mime_type: v.mimeType,
    size_bytes: v.sizeBytes,
    version_label: v.versionLabel || null,
    effective_from: v.effectiveFrom || null,
    review_due: v.reviewDue || null,
    sort_order: v.sortOrder,
    uploaded_by: session.userId,
  }

  const { data: before } = await supabase
    .from('documents')
    .select('id, visibility')
    .eq('id', v.id)
    .maybeSingle()

  const { error } = await supabase.from('documents').upsert(row)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: before ? 'document.updated' : 'document.uploaded',
    p_entity: 'documents',
    p_entity_id: v.id,
    p_before: before ? { visibility: before.visibility } : undefined,
    p_after: { title: v.title, category: v.category, visibility: v.visibility },
  })

  revalidateDocuments()
  return { ok: true, message: before ? 'Document updated' : 'Document added' }
}

export async function updateDocumentDetailsAction(input: {
  id: string
  title: string
  category: string
  versionLabel?: string | null
  reviewDue?: string | null
}): Promise<ActionResult> {
  await requireRole('committee')
  const schema = documentSchema.pick({
    id: true,
    title: true,
    category: true,
    versionLabel: true,
    reviewDue: true,
  })
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('documents')
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      version_label: parsed.data.versionLabel || null,
      review_due: parsed.data.reviewDue || null,
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'document.updated',
    p_entity: 'documents',
    p_entity_id: parsed.data.id,
    p_after: { title: parsed.data.title, category: parsed.data.category },
  })
  revalidateDocuments()
  return { ok: true, message: 'Document updated' }
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown document' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('documents')
    .select('title, visibility, storage_path')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Document not found' }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: 'document.deleted',
    p_entity: 'documents',
    p_entity_id: id,
    p_before: { title: before.title, visibility: before.visibility },
  })
  revalidateDocuments()
  return { ok: true, message: `${before.title} removed` }
}
