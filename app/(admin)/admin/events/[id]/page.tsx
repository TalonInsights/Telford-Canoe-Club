import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'

import { AttendeesTable } from '@/components/admin/attendees-table'
import { EventForm } from '@/components/admin/event-form'
import { EventStatusButtons } from '@/components/admin/event-status-buttons'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requireRole } from '@/lib/auth/guards'
import { eventCategoryLabel, eventStatusLabel } from '@/lib/events/labels'
import { formatDateTimeRange } from '@/lib/format'
import { getEventAttendance, getEventAttendees, getEventById } from '@/lib/queries/events'

export const metadata: Metadata = { title: 'Event' }

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  await requireRole('committee')
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  const event = await getEventById(id)
  if (!event) notFound()

  const [attendees, attendance] = await Promise.all([
    getEventAttendees(id),
    getEventAttendance(id),
  ])
  const confirmed = attendees.filter((a) => a.status === 'booked' || a.status === 'attended').length

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/events" className="text-sm text-river underline-offset-4 hover:underline">
            ← All events
          </Link>
          <h1 className="mt-1 text-2xl">{event.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Badge
              variant={
                event.status === 'published' ? 'success' : event.status === 'cancelled' ? 'signal' : 'outline'
              }
            >
              {eventStatusLabel[event.status] ?? event.status}
            </Badge>
            <span>{eventCategoryLabel[event.category] ?? 'Event'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDateTimeRange(event.starts_at, event.ends_at)}</span>
            {event.location_name && (
              <>
                <span aria-hidden="true">·</span>
                <span>{event.location_name}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {event.status !== 'draft' && (
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-river underline-offset-4 hover:underline"
            >
              View on the site <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
          )}
          <EventStatusButtons eventId={event.id} status={event.status} title={event.title} confirmed={confirmed} />
        </div>
      </div>

      <Tabs defaultValue={tab === 'attendees' ? 'attendees' : 'details'} className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees <span className="ml-1 tabular-nums">({confirmed})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <EventForm eventId={event.id} row={event} mode="edit" />
        </TabsContent>
        <TabsContent value="attendees" className="pt-4">
          {event.booking_enabled ? (
            <AttendeesTable rows={attendees} attendance={attendance} eventTitle={event.title} />
          ) : (
            <p className="rounded-xl border border-stone bg-card p-5 text-sm text-ink-muted">
              This event doesn&apos;t take confirmations — members just turn up. Switch on
              &ldquo;Members confirm attendance&rdquo; in the details tab to start collecting names.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
