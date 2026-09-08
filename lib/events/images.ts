/**
 * P5-02 — where an event's picture lives. Uploaded covers sit in the public
 * `site-images` bucket at `events/{event_id}/cover-{ts}.{ext}` (§5.3); the
 * three seed events still point at the bundled placeholders. The resolver is
 * shared with the committee photos and lives in lib/storage/site-images.ts;
 * this module keeps the event-flavoured names every event surface imports.
 */

export { SITE_IMAGES_BUCKET, eventCoverPath, siteImageUrl as eventImageUrl } from '@/lib/storage/site-images'
