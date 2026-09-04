/** One vocabulary for event categories — the form, the cards and the calendar all read it. */
export const eventCategories = [
  'club_night',
  'trip',
  'freestyle',
  'slalom',
  'pool',
  'social',
  'course',
  'other',
] as const

export type EventCategory = (typeof eventCategories)[number]

export const eventCategoryLabel: Record<string, string> = {
  club_night: 'Club night',
  trip: 'Trip',
  freestyle: 'Freestyle',
  slalom: 'Slalom',
  pool: 'Pool session',
  social: 'Social',
  course: 'Course',
  other: 'Event',
}

export const eventStatusLabel: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
}

/**
 * `events.body` holds `{type:'text', text}` until the Tiptap renderer lands
 * (P7-02). Blank lines separate paragraphs.
 */
export function eventDetailsParagraphs(body: unknown): string[] {
  return eventDetailsText(body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function eventDetailsText(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const text = (body as { text?: unknown }).text
  return typeof text === 'string' ? text : ''
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
