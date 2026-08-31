import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDateTimeRange } from '@/lib/format'
import { getMyBookings } from '@/lib/queries/members'
import { CancelBookingButton } from '@/components/members/cancel-booking'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'My bookings' }

export default async function MyEventsPage() {
  await requireCurrentMember()
  const bookings = await getMyBookings()

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No bookings yet"
        description="When a session takes bookings you can grab a place from its event page."
        action={
          <Button asChild variant="secondary">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="divide-y divide-stone overflow-hidden rounded-xl border border-stone bg-card">
      {bookings.map((b) => (
        <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 grow">
            <Link
              href={b.event ? `/events/${b.event.slug}` : '/events'}
              className="font-medium underline-offset-4 hover:underline"
            >
              {b.event?.title ?? 'Event'}
            </Link>
            <p className="text-micro text-ink-muted">
              {b.event && formatDateTimeRange(b.event.starts_at, b.event.ends_at)}
              {b.event?.location_name && <> · {b.event.location_name}</>}
            </p>
          </div>
          <Badge variant={b.status === 'booked' ? 'success' : 'outline'}>
            {b.status === 'booked' ? 'Booked' : b.status === 'waitlist' ? 'Waitlist' : b.status}
          </Badge>
          <CancelBookingButton bookingId={b.id} />
        </li>
      ))}
    </ul>
  )
}
