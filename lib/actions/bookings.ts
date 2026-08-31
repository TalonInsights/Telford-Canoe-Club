'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession } from '@/lib/auth/guards'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

export async function bookEventAction(eventId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = z.uuid().safeParse(eventId)
  if (!parsed.success) return { ok: false, message: 'Unknown event' }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in to book a place' }

  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, title, status, booking_enabled, booking_opens_at, booking_closes_at, capacity, allow_waitlist, members_only_booking')
    .eq('id', parsed.data)
    .maybeSingle()
  if (!event || event.status !== 'published') return { ok: false, message: 'This event is not open' }
  if (!event.booking_enabled) return { ok: false, message: 'This event doesn’t take bookings' }

  const now = new Date()
  if (event.booking_opens_at && new Date(event.booking_opens_at) > now)
    return { ok: false, message: 'Booking hasn’t opened yet' }
  if (event.booking_closes_at && new Date(event.booking_closes_at) < now)
    return { ok: false, message: 'Booking has closed' }
  if (event.members_only_booking && !session.isCurrentMember)
    return { ok: false, message: 'This event is members-only — join the club to book' }

  let status: 'booked' | 'waitlist' = 'booked'
  if (event.capacity != null) {
    const { count } = await supabase
      .from('event_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'booked')
    if ((count ?? 0) >= event.capacity) {
      if (!event.allow_waitlist) return { ok: false, message: 'This event is full' }
      status = 'waitlist'
    }
  }

  const { error } = await supabase
    .from('event_bookings')
    .upsert(
      { event_id: event.id, user_id: session.userId, status },
      { onConflict: 'event_id,user_id' }
    )
  if (error) return { ok: false, message: error.message }

  await supabase.rpc('audit', {
    p_action: status === 'booked' ? 'booking.created' : 'booking.waitlisted',
    p_entity: 'event_bookings',
    p_after: { event: event.title },
  })
  revalidatePath('/members/events')
  return {
    ok: true,
    message: status === 'booked' ? 'Booked — see you on the water' : 'Added to the waitlist',
  }
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = z.uuid().safeParse(bookingId)
  if (!parsed.success) return { ok: false, message: 'Unknown booking' }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('event_bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', parsed.data)
    .eq('user_id', session.userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/members/events')
  return { ok: true, message: 'Booking cancelled' }
}
