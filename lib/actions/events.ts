'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { sendBookingEmail } from '@/lib/email/bookings'
import type { EventInput } from '@/lib/events/form'
import { eventCategories } from '@/lib/events/labels'
import { formatDateTimeRange } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Enter a valid date and time')

const eventSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(3, 'Give the event a title').max(120),
    slug: z
      .string()
      .trim()
      .min(3, 'The web address needs at least 3 characters')
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Web address: lowercase letters, numbers and hyphens only'),
    category: z.enum(eventCategories),
    summary: z
      .string()
      .trim()
      .min(10, 'Add a one-line summary — it shows on every event card')
      .max(300, 'Keep the summary under 300 characters'),
    details: z.string().trim().max(5000).optional(),
    startsAt: isoDate,
    endsAt: isoDate.nullable().optional(),
    locationName: z.string().trim().min(2, 'Say where the event is').max(120),
    locationAddress: z.string().trim().max(200).optional(),
    visibility: z.enum(['public', 'members']),
    waterLevelDependent: z.boolean(),
    costPence: z.number().int().min(0).max(100_000),
    costNote: z.string().trim().max(200).optional(),
    bookingEnabled: z.boolean(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').max(999).nullable(),
    allowWaitlist: z.boolean(),
    membersOnlyBooking: z.boolean(),
    bookingOpensAt: isoDate.nullable().optional(),
    bookingClosesAt: isoDate.nullable().optional(),
    coverImagePath: z.string().trim().max(300).nullable(),
  })
  .refine((v) => !v.endsAt || Date.parse(v.endsAt) >= Date.parse(v.startsAt), {
    message: 'The end time is before the start',
    path: ['endsAt'],
  })
  .refine(
    (v) =>
      !v.bookingOpensAt ||
      !v.bookingClosesAt ||
      Date.parse(v.bookingClosesAt) >= Date.parse(v.bookingOpensAt),
    { message: 'Confirmations close before they open', path: ['bookingClosesAt'] }
  )

export type SaveEventResult = ActionResult & { id?: string }

const publicPaths = ['/', '/events', '/members', '/members/events', '/admin', '/admin/events']

function revalidateEvent(id: string, ...slugs: (string | null | undefined)[]) {
  for (const p of publicPaths) revalidatePath(p)
  revalidatePath(`/admin/events/${id}`)
  for (const s of slugs) if (s) revalidatePath(`/events/${s}`)
}

/**
 * P5-02 — create or update an event. The id comes from the form (new events
 * mint a uuid client-side so the cover upload has a home before the row
 * exists). Committee only, RLS re-checks, every save audited.
 */
export async function saveEventAction(
  input: EventInput,
  options: { publish?: boolean } = {}
): Promise<SaveEventResult> {
  const session = await requireRole('committee')
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  const v = parsed.data

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('events')
    .select('id, slug, status, title')
    .eq('id', v.id)
    .maybeSingle()

  const row = {
    title: v.title,
    slug: v.slug,
    category: v.category,
    summary: v.summary,
    body: v.details ? { type: 'text', text: v.details } : null,
    starts_at: new Date(v.startsAt).toISOString(),
    ends_at: v.endsAt ? new Date(v.endsAt).toISOString() : null,
    location_name: v.locationName,
    location_address: v.locationAddress || null,
    visibility: v.visibility,
    water_level_dependent: v.waterLevelDependent,
    cost_pence: v.costPence,
    cost_note: v.costNote || null,
    booking_enabled: v.bookingEnabled,
    capacity: v.bookingEnabled ? v.capacity : null,
    allow_waitlist: v.allowWaitlist,
    members_only_booking: v.membersOnlyBooking,
    booking_opens_at: v.bookingEnabled && v.bookingOpensAt ? new Date(v.bookingOpensAt).toISOString() : null,
    booking_closes_at:
      v.bookingEnabled && v.bookingClosesAt ? new Date(v.bookingClosesAt).toISOString() : null,
    cover_image_path: v.coverImagePath,
  }

  const friendly = (message: string, code?: string) =>
    code === '23505' || /events_slug_key/.test(message)
      ? 'That web address is already used by another event — change the slug'
      : message

  if (before) {
    const { error } = await supabase
      .from('events')
      .update({ ...row, ...(options.publish ? { status: 'published' } : {}) })
      .eq('id', v.id)
    if (error) return { ok: false, message: friendly(error.message, error.code) }
    await supabase.rpc('audit', {
      p_action: options.publish && before.status !== 'published' ? 'event.published' : 'event.updated',
      p_entity: 'events',
      p_entity_id: v.id,
      p_before: { title: before.title, slug: before.slug, status: before.status },
      p_after: { title: v.title, slug: v.slug, starts_at: row.starts_at },
    })
    revalidateEvent(v.id, before.slug, v.slug)
    return { ok: true, id: v.id, message: options.publish ? 'Event published' : 'Event saved' }
  }

  const { error } = await supabase.from('events').insert({
    id: v.id,
    ...row,
    status: options.publish ? 'published' : 'draft',
    organiser_user_id: session.userId,
  })
  if (error) return { ok: false, message: friendly(error.message, error.code) }
  await supabase.rpc('audit', {
    p_action: options.publish ? 'event.published' : 'event.created',
    p_entity: 'events',
    p_entity_id: v.id,
    p_after: { title: v.title, slug: v.slug, starts_at: row.starts_at },
  })
  revalidateEvent(v.id, v.slug)
  return {
    ok: true,
    id: v.id,
    message: options.publish ? 'Event created and published' : 'Event saved as a draft',
  }
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['draft', 'published', 'cancelled']),
})

/** Draft ⇄ published ⇄ cancelled. Cancelling emails everyone confirmed or waiting. */
export async function setEventStatusAction(
  input: z.infer<typeof statusSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = statusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Invalid request' }
  const { id, status } = parsed.data

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('events')
    .select('id, title, slug, status, starts_at, ends_at, location_name')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Event not found' }
  if (before.status === status) return { ok: true, message: 'No change' }

  const { error } = await supabase.from('events').update({ status }).eq('id', id)
  if (error) return { ok: false, message: error.message }

  const action =
    status === 'published'
      ? 'event.published'
      : status === 'cancelled'
        ? 'event.cancelled'
        : 'event.unpublished'
  await supabase.rpc('audit', {
    p_action: action,
    p_entity: 'events',
    p_entity_id: id,
    p_before: { status: before.status },
    p_after: { status, title: before.title },
  })

  if (status === 'cancelled') {
    const { data: attendees } = await supabase
      .from('event_bookings')
      .select('id, profiles(first_name, email)')
      .eq('event_id', id)
      .in('status', ['booked', 'waitlist', 'attended'])
    const when = formatDateTimeRange(before.starts_at, before.ends_at)
    await Promise.all(
      (attendees ?? []).map((b) => {
        const p = b.profiles as unknown as { first_name: string; email: string } | null
        return sendBookingEmail({
          kind: 'event_cancelled',
          to: p?.email,
          name: p?.first_name ?? '',
          eventTitle: before.title,
          when,
          location: before.location_name,
          slug: before.slug,
        })
      })
    )
  }

  revalidateEvent(id, before.slug)
  return {
    ok: true,
    message:
      status === 'published'
        ? 'Event published'
        : status === 'cancelled'
          ? 'Event cancelled — everyone confirmed has been told'
          : 'Event taken back to draft',
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Invalid event' }
  const supabase = await createClient()
  const { data: before } = await supabase
    .from('events')
    .select('title, slug, status')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Event not found' }

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  await supabase.rpc('audit', {
    p_action: 'event.deleted',
    p_entity: 'events',
    p_entity_id: id,
    p_before: { title: before.title, slug: before.slug, status: before.status },
  })
  revalidateEvent(id, before.slug)
  return { ok: true, message: `"${before.title}" deleted` }
}

const attendeeStatusSchema = z.object({
  bookingId: z.uuid(),
  status: z.enum(['booked', 'attended', 'no_show']),
})

/** P5-07 — check in, mark a no-show, or put someone back to confirmed. */
export async function setAttendeeStatusAction(
  input: z.infer<typeof attendeeStatusSchema>
): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = attendeeStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Invalid request' }
  const { bookingId, status } = parsed.data

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('event_bookings')
    .select('status, event_id')
    .eq('id', bookingId)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Booking not found' }

  const { error } = await supabase
    .from('event_bookings')
    .update({ status, checked_in_at: status === 'attended' ? new Date().toISOString() : null })
    .eq('id', bookingId)
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action:
      status === 'attended'
        ? 'booking.checked_in'
        : status === 'no_show'
          ? 'booking.no_show'
          : 'booking.reinstated',
    p_entity: 'event_bookings',
    p_entity_id: bookingId,
    p_before: { status: before.status },
    p_after: { status },
  })
  revalidatePath(`/admin/events/${before.event_id}`)
  return {
    ok: true,
    message:
      status === 'attended' ? 'Checked in' : status === 'no_show' ? 'Marked as a no-show' : 'Back to confirmed',
  }
}

/** Committee removes someone's place; the waitlist moves up and both are emailed. */
export async function adminCancelBookingAction(bookingId: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(bookingId).success) return { ok: false, message: 'Invalid booking' }
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('event_bookings')
    .select('event_id, profiles(first_name, email), events(title, slug, starts_at, ends_at, location_name)')
    .eq('id', bookingId)
    .maybeSingle()
  if (!booking) return { ok: false, message: 'Booking not found' }

  const { data: promoted, error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId })
  if (error) return { ok: false, message: error.message }

  const ev = booking.events as unknown as {
    title: string
    slug: string
    starts_at: string
    ends_at: string | null
    location_name: string | null
  } | null
  const person = booking.profiles as unknown as { first_name: string; email: string } | null
  if (ev) {
    const when = formatDateTimeRange(ev.starts_at, ev.ends_at)
    const jobs = [
      sendBookingEmail({
        kind: 'cancelled_by_club',
        to: person?.email,
        name: person?.first_name ?? '',
        eventTitle: ev.title,
        when,
        location: ev.location_name,
        slug: ev.slug,
      }),
    ]
    const p = promoted as { email?: string; name?: string } | null
    if (p?.email) {
      jobs.push(
        sendBookingEmail({
          kind: 'promoted',
          to: p.email,
          name: p.name ?? '',
          eventTitle: ev.title,
          when,
          location: ev.location_name,
          slug: ev.slug,
        })
      )
    }
    await Promise.all(jobs)
  }

  revalidatePath(`/admin/events/${booking.event_id}`)
  revalidatePath('/members/events')
  if (ev) revalidatePath(`/events/${ev.slug}`)
  return { ok: true, message: promoted ? 'Place removed — the next person on the waitlist has it' : 'Place removed' }
}
