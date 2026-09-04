/**
 * P5-02 — where an event's picture lives. Uploaded covers sit in the public
 * `site-images` bucket at `events/{event_id}/cover-{ts}.{ext}` (§5.3); the
 * three seed events still point at the bundled placeholders. One resolver
 * serves both, so every list, card and hero reads `cover_image_path` the
 * same way. Safe on the server and in the browser (public env only).
 */

export const SITE_IMAGES_BUCKET = 'site-images'

export function eventImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('placeholders/')) return `/images/${path}`
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${SITE_IMAGES_BUCKET}/${path}`
}

/** A fresh object path for an event's cover — the timestamp busts caches on replace. */
export function eventCoverPath(eventId: string, fileName: string): string {
  const ext =
    (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `events/${eventId}/cover-${Date.now()}.${ext}`
}
