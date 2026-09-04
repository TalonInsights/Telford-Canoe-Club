'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession } from '@/lib/auth/guards'
import { sendBookingEmail } from '@/lib/email/bookings'
import { formatDateTimeRange } from '@/lib/format'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

/** Postgres raises lower-case sentences; the toast wants a capital. */
function friendly(message: string): string {
  const m = message.replace(/^[A-Z0-9]+:\s*/, '')
  return m.charAt(0).toUpperCase() + m.slice(1)
}

/**
 * P5-04 — "I'm coming". The place is decided by `book_event()` inside the
 * database (row lock on the event, capacity, waitlist, members-only), so this
 * action only validates, calls, emails and revalidates.
 */
export async function bookEventAction(eventId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = z.uuid().safeParse(eventId)
  if (!parsed.success) return { ok: false, message: 'Unknown event' }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in to confirm your place' }

  const supabase = await createClient()
  const { data: status, error } = await supabase.rpc('book_event', { p_event_id: parsed.data })
  if (error) return { ok: false, message: friendly(error.message) }

  const { data: event } = await supabase
    .from('events')
    .select('title, slug, starts_at, ends_at, location_name')
    .eq('id', parsed.data)
    .maybeSingle()
  if (event) {
    await sendBookingEmail({
      kind: status === 'waitlist' ? 'waitlist' : 'confirmed',
      to: session.email,
      name: session.profile.first_name ?? '',
      eventTitle: event.title,
      when: formatDateTimeRange(event.starts_at, event.ends_at),
      location: event.location_name,
      slug: event.slug,
    })
    revalidatePath(`/events/${event.slug}`)
  }
  revalidatePath('/members/events')
  revalidatePath('/members')
  revalidatePath(`/admin/events/${parsed.data}`)

  return {
    ok: true,
    message:
      status === 'waitlist'
        ? "You're on the waitlist — we'll email you if a place frees up"
        : "You're confirmed — see you on the water",
  }
}

/** Own cancellation; `cancel_booking()` promotes the next waitlisted person. */
export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = z.uuid().safeParse(bookingId)
  if (!parsed.success) return { ok: false, message: 'Unknown booking' }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }

  const supabase = await createClient()
  const { data: booking } = await supabase
    .from('event_bookings')
    .select('event_id, events(title, slug, starts_at, ends_at, location_name)')
    .eq('id', parsed.data)
    .eq('user_id', session.userId)
    .maybeSingle()
  if (!booking) return { ok: false, message: 'Booking not found' }

  const { data: promoted, error } = await supabase.rpc('cancel_booking', { p_booking_id: parsed.data })
  if (error) return { ok: false, message: friendly(error.message) }

  const ev = booking.events as unknown as {
    title: string
    slug: string
    starts_at: string
    ends_at: string | null
    location_name: string | null
  } | null
  const p = promoted as { email?: string; name?: string } | null
  if (ev && p?.email) {
    await sendBookingEmail({
      kind: 'promoted',
      to: p.email,
      name: p.name ?? '',
      eventTitle: ev.title,
      when: formatDateTimeRange(ev.starts_at, ev.ends_at),
      location: ev.location_name,
      slug: ev.slug,
    })
  }

  if (ev) revalidatePath(`/events/${ev.slug}`)
  revalidatePath('/members/events')
  revalidatePath('/members')
  revalidatePath(`/admin/events/${booking.event_id}`)
  return { ok: true, message: 'Your place is cancelled' }
}
