import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type EventRow = Tables<'events'>

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
