import type { Tables } from '@/lib/queries/helpers'

import { eventDetailsText, type EventCategory } from './labels'

/**
 * P5-02 — the shape the admin form edits. Dates stay as Date objects for the
 * pickers and become ISO strings in `formToInput`; money is typed in pounds
 * and stored in pence. Shared by the server page (row → form) and the client
 * form (form → action input), so it carries no React and no directive.
 */
export type EventFormValues = {
  title: string
  slug: string
  category: EventCategory
  summary: string
  details: string
  startsAt?: Date
  endsAt?: Date
  locationName: string
  locationAddress: string
  visibility: 'public' | 'members'
  waterLevelDependent: boolean
  costPounds: string
  costNote: string
  bookingEnabled: boolean
  capacity: string
  allowWaitlist: boolean
  membersOnlyBooking: boolean
  bookingOpensAt?: Date
  bookingClosesAt?: Date
  coverImagePath: string | null
}

export type EventInput = {
  id: string
  title: string
  slug: string
  category: EventCategory
  summary: string
  details?: string
  startsAt: string
  endsAt?: string | null
  locationName: string
  locationAddress?: string
  visibility: 'public' | 'members'
  waterLevelDependent: boolean
  costPence: number
  costNote?: string
  bookingEnabled: boolean
  capacity: number | null
  allowWaitlist: boolean
  membersOnlyBooking: boolean
  bookingOpensAt?: string | null
  bookingClosesAt?: string | null
  coverImagePath: string | null
}

export function emptyEventForm(): EventFormValues {
  return {
    title: '',
    slug: '',
    category: 'club_night',
    summary: '',
    details: '',
    startsAt: undefined,
    endsAt: undefined,
    locationName: 'Jackfield Rapids',
    locationAddress: 'The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ',
    visibility: 'public',
    waterLevelDependent: false,
    costPounds: '0.00',
    costNote: '',
    bookingEnabled: true,
    capacity: '',
    allowWaitlist: true,
    membersOnlyBooking: true,
    bookingOpensAt: undefined,
    bookingClosesAt: undefined,
    coverImagePath: null,
  }
}

export function eventRowToForm(row: Tables<'events'>): EventFormValues {
  return {
    title: row.title,
    slug: row.slug,
    category: row.category as EventCategory,
    summary: row.summary ?? '',
    details: eventDetailsText(row.body),
    startsAt: new Date(row.starts_at),
    endsAt: row.ends_at ? new Date(row.ends_at) : undefined,
    locationName: row.location_name ?? '',
    locationAddress: row.location_address ?? '',
    visibility: row.visibility === 'members' ? 'members' : 'public',
    waterLevelDependent: row.water_level_dependent,
    costPounds: (row.cost_pence / 100).toFixed(2),
    costNote: row.cost_note ?? '',
    bookingEnabled: row.booking_enabled,
    capacity: row.capacity != null ? String(row.capacity) : '',
    allowWaitlist: row.allow_waitlist,
    membersOnlyBooking: row.members_only_booking,
    bookingOpensAt: row.booking_opens_at ? new Date(row.booking_opens_at) : undefined,
    bookingClosesAt: row.booking_closes_at ? new Date(row.booking_closes_at) : undefined,
    coverImagePath: row.cover_image_path,
  }
}

export function formToInput(id: string, f: EventFormValues): EventInput {
  const capacity = f.capacity.trim() === '' ? null : Number(f.capacity)
  return {
    id,
    title: f.title,
    slug: f.slug,
    category: f.category,
    summary: f.summary,
    details: f.details || undefined,
    startsAt: f.startsAt ? f.startsAt.toISOString() : '',
    endsAt: f.endsAt ? f.endsAt.toISOString() : null,
    locationName: f.locationName,
    locationAddress: f.locationAddress || undefined,
    visibility: f.visibility,
    waterLevelDependent: f.waterLevelDependent,
    costPence: Math.round((Number(f.costPounds) || 0) * 100),
    costNote: f.costNote || undefined,
    bookingEnabled: f.bookingEnabled,
    capacity: Number.isFinite(capacity) ? capacity : null,
    allowWaitlist: f.allowWaitlist,
    membersOnlyBooking: f.membersOnlyBooking,
    bookingOpensAt: f.bookingOpensAt ? f.bookingOpensAt.toISOString() : null,
    bookingClosesAt: f.bookingClosesAt ? f.bookingClosesAt.toISOString() : null,
    coverImagePath: f.coverImagePath,
  }
}
