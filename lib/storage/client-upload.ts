'use client'

import { SITE_IMAGES_BUCKET } from '@/lib/storage/site-images'
import { createClient } from '@/lib/supabase/client'

/**
 * Browser → Supabase Storage under the signed-in committee member's own
 * session: the bucket policies (0016, 0022) are the security boundary, there
 * is no server hop and no body-size ceiling. Returns the object path for the
 * row.
 */
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string }
): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
    cacheControl: options?.cacheControl ?? '31536000',
  })
  if (error) throw new Error(error.message)
  return path
}

export async function uploadSiteImage(path: string, file: File): Promise<string> {
  return uploadToBucket(SITE_IMAGES_BUCKET, path, file)
}

/** Best-effort tidy-up of a file a row no longer points at. */
export async function removeFromBucket(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}

export async function removeSiteImage(path: string): Promise<void> {
  return removeFromBucket(SITE_IMAGES_BUCKET, path)
}
