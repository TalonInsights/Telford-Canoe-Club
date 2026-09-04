import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Enums, Tables } from '@/lib/queries/helpers'

export type EventRow = Tables<'events'>
export type BookingStatus = Enums<'booking_status'>

/** Seed events shown until the database is connected — same three as supabase/seed.sql. */
function seedEvents(): EventRow[] {
  const day = (offset: number, h: number, m = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const base = {
    body: null,
    booking_closes_at: null,
    booking_opens_at: null,
    all_day: false,
    allow_waitlist: true,
    capacity: null,
    cost_note: null,
    cost_pence: 0,
    created_at: day(-30, 9),
    updated_at: null,
    location_lat: null,
    location_lng: null,
    members_only_booking: true,
    organiser_user_id: null,
    recurrence_rule: null,
    status: 'published',
    visibility: 'public' as const,
  }
  return [
    {
      ...base,
      id: 'seed-club-evening-paddle',
      slug: 'club-evening-paddle',
      title: 'Club evening paddle',
      summary:
        'Our regular summer evening session at Jackfield Rapids — water levels dependent, all welcome from improver upwards.',
      category: 'club_night',
      location_name: 'Jackfield Rapids',
      location_address: 'The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ',
      starts_at: day(4, 17, 30),
      ends_at: day(4, 21),
      booking_enabled: false,
      water_level_dependent: true,
      cover_image_path: 'placeholders/hero-jackfield.jpg',
    },
    {
      ...base,
      id: 'seed-pool-session',
      slug: 'pool-session',
      title: 'Pool session',
      summary: 'Indoor skills session — rolling practice and boat handling in warm water.',
      category: 'pool',
      location_name: 'Local pool',
      location_address: null,
      starts_at: day(11, 19),
      ends_at: day(11, 20),
      booking_enabled: true,
      water_level_dependent: false,
      cover_image_path: null,
    },
    {
      ...base,
      id: 'seed-freestyle-session',
      slug: 'freestyle-session',
      title: 'Freestyle session',
      summary:
        'Playboating on the wave when levels allow — coaching support for new freestyle paddlers.',
      category: 'freestyle',
      location_name: 'Jackfield Rapids',
      location_address: 'The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ',
      starts_at: day(13, 10),
      ends_at: day(13, 13),
      booking_enabled: false,
      water_level_dependent: true,
      cover_image_path: 'placeholders/fs-hpp-air.jpg',
    },
  ]
}

export async function getPublishedEvents(): Promise<EventRow[]> {
  if (!isSupabaseConfigured()) {
    return seedEvents().sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'cancelled'])
    .order('starts_at', { ascending: true })
  return data ?? []
}

export async function getUpcomingEvents(limit = 3): Promise<EventRow[]> {
  const all = await getPublishedEvents()
  return all.filter((e) => new Date(e.starts_at) >= new Date() && e.status === 'published').slice(0, limit)
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  if (!isSupabaseConfigured()) {
    return seedEvents().find((e) => e.slug === slug) ?? null
  }
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle()
  return data
}

/* ------------------------------------------------------------------ P5 — attendance */

export type MyBooking = { id: string; status: BookingStatus }

/** The signed-in person's own row for an event (explicitly user-scoped, never RLS-scoped). */
export async function getMyBookingForEvent(eventId: string): Promise<MyBooking | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('event_bookings')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()
  return data ? { id: data.id, status: data.status } : null
}

export type Attendance = { confirmed: number; waitlist: number; capacity: number | null }

/** Live counts via the definer function — numbers only, safe for anyone. */
export async function getEventAttendance(eventId: string): Promise<Attendance | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.rpc('event_attendance', { p_event_id: eventId })
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    confirmed: row.confirmed ?? 0,
    waitlist: row.waitlist ?? 0,
    capacity: row.capacity ?? null,
  }
}

/* ------------------------------------------------------------------ P5 — committee */

export type AdminEventRow = EventRow & { confirmed: number; waitlist: number }

/** Every event, every status, with confirmed/waitlist counts — committee only (RLS). */
export async function getAdminEvents(): Promise<AdminEventRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const [{ data: events }, { data: bookings }] = await Promise.all([
    supabase.from('events').select('*').order('starts_at', { ascending: false }),
    supabase
      .from('event_bookings')
      .select('event_id, status')
      .in('status', ['booked', 'attended', 'waitlist']),
  ])
  const counts = new Map<string, { confirmed: number; waitlist: number }>()
  for (const b of bookings ?? []) {
    const c = counts.get(b.event_id) ?? { confirmed: 0, waitlist: 0 }
    if (b.status === 'waitlist') c.waitlist += 1
    else c.confirmed += 1
    counts.set(b.event_id, c)
  }
  return (events ?? []).map((e) => ({ ...e, ...(counts.get(e.id) ?? { confirmed: 0, waitlist: 0 }) }))
}

export async function getEventById(id: string): Promise<EventRow | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  return data
}

export type AttendeeRow = Tables<'event_bookings'> & {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  is_junior: boolean
}

/** Who is coming — every booking row for the event with the person attached. */
export async function getEventAttendees(eventId: string): Promise<AttendeeRow[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_bookings')
    .select('*, profiles(first_name, last_name, email, phone, date_of_birth)')
    .eq('event_id', eventId)
    .order('booked_at', { ascending: true })
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return (data ?? []).map((b) => {
    const { profiles, ...booking } = b
    const p = profiles as unknown as {
      first_name: string
      last_name: string
      email: string
      phone: string | null
      date_of_birth: string | null
    } | null
    const dob = p?.date_of_birth ? new Date(p.date_of_birth) : null
    return {
      ...booking,
      first_name: p?.first_name ?? '',
      last_name: p?.last_name ?? '',
      email: p?.email ?? '',
      phone: p?.phone ?? null,
      is_junior: Boolean(dob && dob > cutoff),
    }
  })
}
