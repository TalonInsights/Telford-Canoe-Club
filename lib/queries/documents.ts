import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import {
  documentBucket,
  isPubliclyServed,
  publicDocumentUrl,
  type DocumentVisibility,
} from '@/lib/storage/documents'
import type { Tables } from '@/lib/queries/helpers'

export type DocumentRow = Tables<'documents'>

/** A row plus the link to fetch it with, which depends on where the file lives. */
export type DocumentWithLink = DocumentRow & { href: string | null }

const SIGNED_URL_SECONDS = 3600

/**
 * Attach a usable link to each row. Public files come from the public bucket
 * directly; members' and committee files are signed for an hour under the
 * caller's own session, so the storage policy is what decides whether a link
 * can be minted at all. A row whose file cannot be signed comes back with a
 * null href rather than vanishing, so the committee can see and fix it.
 */
async function withLinks(rows: DocumentRow[]): Promise<DocumentWithLink[]> {
  if (rows.length === 0) return []
  const supabase = await createClient()

  // Group by bucket so each bucket is signed in one round trip rather than one
  // per row (the old members page signed serially, N requests deep).
  const byBucket = new Map<string, DocumentRow[]>()
  for (const row of rows) {
    if (isPubliclyServed(row.visibility)) continue
    const bucket = documentBucket(row.visibility)
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), row])
  }

  const signed = new Map<string, string>()
  await Promise.all(
    [...byBucket.entries()].map(async ([bucket, bucketRows]) => {
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrls(
          bucketRows.map((r) => r.storage_path),
          SIGNED_URL_SECONDS
        )
      data?.forEach((entry, i) => {
        const row = bucketRows[i]
        if (row && entry?.signedUrl) signed.set(row.id, entry.signedUrl)
      })
    })
  )

  return rows.map((row) => ({
    ...row,
    href: isPubliclyServed(row.visibility)
      ? publicDocumentUrl(row.storage_path)
      : (signed.get(row.id) ?? null),
  }))
}

/** Everything the caller is allowed to see, newest first within each category. */
export async function getDocuments(
  visibility?: DocumentVisibility
): Promise<DocumentWithLink[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  let query = supabase
    .from('documents')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (visibility) query = query.eq('visibility', visibility)
  const { data } = await query
  return withLinks(data ?? [])
}

/** The members' library: their own documents and anything public. */
export async function getMemberDocuments(): Promise<DocumentWithLink[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .in('visibility', ['members', 'public'])
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  return withLinks(data ?? [])
}

/** The committee's own records: bookings, contacts, inventory. */
export async function getCommitteeDocuments(): Promise<DocumentWithLink[]> {
  return getDocuments('committee')
}

export async function getDocumentById(id: string): Promise<DocumentRow | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('documents').select('*').eq('id', id).maybeSingle()
  return data
}
