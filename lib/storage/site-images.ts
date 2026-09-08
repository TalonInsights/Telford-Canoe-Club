/**
 * Where the site's uploaded pictures live: the public `site-images` bucket
 * (§5.3), written straight from a committee member's browser and readable by
 * anyone. One resolver turns a stored object path into a URL, so event cards,
 * heroes and committee tiles all read a path the same way. Safe on the server
 * and in the browser (public env only).
 */

export const SITE_IMAGES_BUCKET = 'site-images'

export function siteImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('placeholders/')) return `/images/${path}`
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${SITE_IMAGES_BUCKET}/${path}`
}

function fileExtension(fileName: string): string {
  return (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
}

/** A fresh object path for an event's cover; the timestamp busts caches on replace. */
export function eventCoverPath(eventId: string, fileName: string): string {
  return `events/${eventId}/cover-${Date.now()}.${fileExtension(fileName)}`
}

/** The photo beside a committee name, keyed by the role row (0021) so a replacement never collides. */
export function committeePhotoPath(roleId: string, fileName: string): string {
  return `committee/${roleId}/photo-${Date.now()}.${fileExtension(fileName)}`
}
