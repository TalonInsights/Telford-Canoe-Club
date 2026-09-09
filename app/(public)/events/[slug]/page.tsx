import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Info, MapPin, Tag, Waves } from 'lucide-react'

import { BookingPanel } from '@/components/site/booking-panel'
import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth/guards'
import { eventImageUrl } from '@/lib/events/images'
import { eventCategoryLabel, eventDetailsParagraphs } from '@/lib/events/labels'
import { formatDateTimeRange, formatMoneyGBP } from '@/lib/format'
import {
  getEventAttendance,
  getEventBySlug,
  getMyBookingForEvent,
} from '@/lib/queries/events'

export const revalidate = 900

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  const image = eventImageUrl(event?.cover_image_path)
  return {
    title: event ? event.title : 'Event',
    description: event?.summary ?? 'A Telford Canoe Club event.',
    ...(image ? { openGraph: { images: [image] } } : {}),
  }
}

export default async function EventDetailPage({ params }: Params) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event || event.status === 'draft') notFound()

  const session = await getSession()
  const [myBooking, attendance] = await Promise.all([
    session ? getMyBookingForEvent(event.id) : Promise.resolve(null),
    event.booking_enabled ? getEventAttendance(event.id) : Promise.resolve(null),
  ])
  const details = eventDetailsParagraphs(event.body)
  // A notice is something happening on site that members are told about but
  // not invited to, so nothing on this page may offer a place.
  const noticeOnly = event.kind === 'notice_only'

  return (
    <>
      <PageHero
        title={event.title}
        intro={event.summary ?? undefined}
        image={eventImageUrl(event.cover_image_path) ?? undefined}
        imageAlt={event.title}
        crumbs={[{ title: 'Events', href: '/events' }]}
      />
      <Section tone="white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="max-w-[68ch] lg:col-span-7">
            {event.status === 'cancelled' && (
              <Badge variant="signal" className="mb-4">
                Cancelled
              </Badge>
            )}
            {noticeOnly && (
              <div className="mb-4 rounded-xl border border-warn/30 bg-card p-4">
                <p className="flex items-center gap-2 font-medium text-warn">
                  <Info aria-hidden="true" className="size-4" />
                  On site, not a club session
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  This is happening at Jackfield but it is not a club event and there is nothing to
                  sign up for. The site stays open as usual.
                  {event.on_site_note ? ` Expect: ${event.on_site_note}.` : ''}
                </p>
              </div>
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
              <div className="flex items-start gap-2.5">
                <Tag className="mt-1 size-4 shrink-0 text-river" aria-hidden="true" />
                <div>
                  <dt className="text-micro font-medium text-ink-muted">What</dt>
                  <dd>
                    {eventCategoryLabel[event.category] ?? 'Event'}
                    {event.visibility === 'members' && (
                      <span className="block text-sm text-ink-muted">Members only</span>
                    )}
                  </dd>
                </div>
              </div>
              {event.water_level_dependent && (
                <div className="flex items-start gap-2.5">
                  <Waves className="mt-1 size-4 shrink-0 text-river" aria-hidden="true" />
                  <div>
                    <dt className="text-micro font-medium text-ink-muted">Conditions</dt>
                    <dd>
                      Water levels dependent:{' '}
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
                      {formatMoneyGBP(event.cost_pence)}
                      {event.cost_note && (
                        <span className="block text-sm text-ink-muted">{event.cost_note}</span>
                      )}
                    </dd>
                  </div>
                </div>
              )}
            </dl>

            {details.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-stone pt-6">
                <h2 className="text-xl">Details</h2>
                {details.map((p, i) => (
                  <p key={i} className="text-ink-muted">
                    {p}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/calendar/event/${event.slug}`}>Add to your calendar (.ics)</a>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            {noticeOnly ? (
              <aside className="rounded-xl border border-stone bg-foam p-5">
                <h2 className="text-lg">Nothing to book</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  This entry is here so you know what is going on at the site that day. If you were
                  planning to paddle, you still can.
                </p>
              </aside>
            ) : (
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
              myBooking={myBooking}
              attendance={attendance}
            />
            )}
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
