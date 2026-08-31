import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'

import { FullGrid } from '@/components/layout/grids'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { EventCard } from '@/components/site/cards'
import { EventCalendar } from '@/components/site/event-calendar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTimeRange } from '@/lib/format'
import { getPublishedEvents } from '@/lib/queries/events'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'What’s on at Telford Canoe Club — club evening paddles, pool sessions, freestyle days, slaloms and trips.',
}

export const revalidate = 900

const categoryLabel: Record<string, string> = {
  club_night: 'Club night',
  trip: 'Trip',
  freestyle: 'Freestyle',
  slalom: 'Slalom',
  pool: 'Pool session',
  social: 'Social',
  course: 'Course',
  other: 'Event',
}

export default async function EventsPage() {
  const events = await getPublishedEvents()
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.starts_at) >= now && e.status === 'published')
  const past = events.filter((e) => new Date(e.starts_at) < now).reverse()

  const imageFor = (path: string | null) => (path ? `/images/${path}` : null)

  return (
    <>
      <PageHero
        title="Events"
        intro="Club nights, pool sessions, freestyle days and trips — water levels permitting."
        image={IMAGES.rapid}
        imageAlt="Paddlers on the water at a club session"
      />
      <Section tone="white">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="pt-6">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled just now"
                description="Check back soon — or join the club and hear about sessions first."
              />
            ) : (
              <FullGrid maxColumns={3}>
                {upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    href={`/events/${e.slug}`}
                    image={imageFor(e.cover_image_path)}
                    imageAlt={e.title}
                    title={e.title}
                    summary={e.summary ?? undefined}
                    category={categoryLabel[e.category] ?? 'Event'}
                    when={formatDateTimeRange(e.starts_at, e.ends_at)}
                    location={e.location_name ?? undefined}
                    status={
                      e.water_level_dependent ? (
                        <Badge variant="outline">Water levels dependent</Badge>
                      ) : undefined
                    }
                  />
                ))}
              </FullGrid>
            )}
          </TabsContent>
          <TabsContent value="calendar" className="pt-6">
            <EventCalendar
              events={upcoming.map((e) => ({
                id: e.id,
                slug: e.slug,
                title: e.title,
                category: e.category,
                startsAt: e.starts_at,
              }))}
            />
          </TabsContent>
          <TabsContent value="past" className="pt-6">
            {past.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No past events recorded yet"
                description="Recent history will build up here as sessions run."
              />
            ) : (
              <FullGrid maxColumns={3}>
                {past.map((e) => (
                  <EventCard
                    key={e.id}
                    href={`/events/${e.slug}`}
                    image={imageFor(e.cover_image_path)}
                    imageAlt={e.title}
                    title={e.title}
                    summary={e.summary ?? undefined}
                    category={categoryLabel[e.category] ?? 'Event'}
                    when={formatDateTimeRange(e.starts_at, e.ends_at)}
                    location={e.location_name ?? undefined}
                  />
                ))}
              </FullGrid>
            )}
          </TabsContent>
        </Tabs>
      </Section>
    </>
  )
}
