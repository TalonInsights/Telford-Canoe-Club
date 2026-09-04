'use client'

import { SITE_IMAGES_BUCKET } from '@/lib/events/images'
import { createClient } from '@/lib/supabase/client'

/**
 * Browser → Supabase Storage under the signed-in committee member's own
 * session: the bucket policies (0016) are the security boundary, there is no
 * server hop and no body-size ceiling. Returns the object path for the row.
 */
export async function uploadSiteImage(path: string, file: File): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(SITE_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '31536000' })
  if (error) throw new Error(error.message)
  return path
}
