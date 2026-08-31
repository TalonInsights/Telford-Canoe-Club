import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, MapPin, Waves } from 'lucide-react'

import { BookingPanel } from '@/components/site/booking-panel'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth/guards'
import { formatDateTimeRange } from '@/lib/format'
import { getEventBySlug } from '@/lib/queries/events'

export const revalidate = 900

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  return {
    title: event ? event.title : 'Event',
    description: event?.summary ?? 'A Telford Canoe Club event.',
  }
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event || event.status === 'draft') notFound()

  const session = await getSession()

  return (
    <>
      <PageHero
        title={event.title}
        intro={event.summary ?? undefined}
        image={event.cover_image_path ? `/images/${event.cover_image_path}` : undefined}
        imageAlt={event.title}
      />
      <Section tone="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="max-w-[68ch] lg:col-span-7">
            {event.status === 'cancelled' && (
              <Badge variant="signal" className="mb-4">
                Cancelled
              </Badge>
            )}
            <dl className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-1 size-4 shrink-0 text-river" aria-hidden="true" />
                <div>
                  <dt className="text-micro font-medium text-ink-muted">When</dt>
                  <dd>{formatDateTimeRange(event.starts_at, event.ends_at)}</dd>
                </div>
              </div>
              {event.location_name && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-1 size-4 shrink-0 text-river" aria-hidden="true" />
                  <div>
                    <dt className="text-micro font-medium text-ink-muted">Where</dt>
                    <dd>
                      {event.location_name}
                      {event.location_address && (
                        <span className="block text-sm text-ink-muted">{event.location_address}</span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
              {event.water_level_dependent && (
                <div className="flex items-start gap-2.5">
                  <Waves className="mt-1 size-4 shrink-0 text-river" aria-hidden="true" />
                  <div>
                    <dt className="text-micro font-medium text-ink-muted">Conditions</dt>
                    <dd>
                      Water levels dependent —{' '}
                      <Link
                        href="/venue/river-levels"
                        className="font-medium text-river underline-offset-4 hover:underline"
                      >
                        check the river before you travel
                      </Link>
                    </dd>
                  </div>
                </div>
              )}
              {event.cost_pence > 0 && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 size-4 shrink-0 text-center font-semibold text-river" aria-hidden="true">
                    £
                  </span>
                  <div>
                    <dt className="text-micro font-medium text-ink-muted">Cost</dt>
                    <dd>
                      £{(event.cost_pence / 100).toFixed(2)}
                      {event.cost_note && (
                        <span className="block text-sm text-ink-muted">{event.cost_note}</span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/calendar/event/${event.slug}`}>Add to your calendar (.ics)</a>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <BookingPanel
              event={{
                id: event.id,
                status: event.status,
                bookingEnabled: event.booking_enabled,
                bookingOpensAt: event.booking_opens_at,
                bookingClosesAt: event.booking_closes_at,
                membersOnly: event.members_only_booking,
                startsAt: event.starts_at,
              }}
              signedIn={Boolean(session)}
              isCurrentMember={Boolean(session?.isCurrentMember)}
            />
          </div>
        </div>
      </Section>
      <Section tone="foam" spacing="tight" title="More from the club">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/events">All events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/join">Join the club</Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
