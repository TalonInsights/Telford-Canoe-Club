/**
 * Where a club document lives, and who may fetch it.
 *
 * The `documents` table records a `visibility`, and that value decides the
 * bucket. This is the important part: the bucket policies in 0016 and 0022 are
 * the real security boundary, not the row. A committee-only file must be in
 * `documents-committee`, because the `documents-members` read policy covers
 * that whole bucket, so a member who guessed an object path would otherwise
 * reach it whatever the row said.
 *
 * Safe on the server and in the browser (public env only).
 */

import type { Enums } from '@/lib/queries/helpers'

export type DocumentVisibility = Enums<'visibility'>

export const DOCUMENT_BUCKETS: Record<DocumentVisibility, string> = {
  public: 'documents-public',
  members: 'documents-members',
  committee: 'documents-committee',
}

export function documentBucket(visibility: DocumentVisibility): string {
  return DOCUMENT_BUCKETS[visibility] ?? DOCUMENT_BUCKETS.members
}

/** Public files are served straight from the public bucket; the rest are signed. */
export function isPubliclyServed(visibility: DocumentVisibility): boolean {
  return visibility === 'public'
}

export function publicDocumentUrl(storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${DOCUMENT_BUCKETS.public}/${storagePath}`
}

/**
 * The categories a document can be filed under. The first group is the club's
 * public and members' paperwork; the second is the committee's own records,
 * which is what the 8 Sep 2026 order asked for.
 */
export const documentCategories = [
  'policy',
  'procedure',
  'constitution',
  'minutes',
  'agm',
  'form',
  'guide',
  'bookings',
  'contacts',
  'inventory',
  'finance',
  'insurance',
  'other',
] as const

export type DocumentCategory = (typeof documentCategories)[number]

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  policy: 'Policy',
  procedure: 'Procedure',
  constitution: 'Constitution',
  minutes: 'Meeting minutes',
  agm: 'AGM papers',
  form: 'Form',
  guide: 'Guide',
  bookings: 'Bookings',
  contacts: 'Council and contacts',
  inventory: 'Inventory',
  finance: 'Finance',
  insurance: 'Insurance',
  other: 'Other',
}

/** The categories offered first when filing a committee-only record. */
export const committeeCategories: DocumentCategory[] = [
  'bookings',
  'contacts',
  'inventory',
  'finance',
  'insurance',
  'minutes',
  'agm',
  'other',
]

export function documentCategoryLabel(category: string): string {
  return documentCategoryLabels[category as DocumentCategory] ?? 'Other'
}

export const visibilityLabels: Record<DocumentVisibility, string> = {
  public: 'Anyone',
  members: 'Members',
  committee: 'Committee only',
}

/**
 * A fresh object path. Keyed by the row id so a replacement never collides,
 * with the original filename kept readable at the end for the committee's own
 * sake when they browse the bucket.
 */
export function documentPath(documentId: string, fileName: string): string {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-80)
  return `${documentId}/${Date.now()}-${cleaned || 'file'}`
}

const UNITS = ['bytes', 'KB', 'MB', 'GB']

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`
}

/** What the upload box accepts: club paperwork, not media. */
export const DOCUMENT_ACCEPT = [
  'application/pdf',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.ppt',
  '.pptx',
]

export const DOCUMENT_MAX_MB = 20
