'use client'

/**
 * P2-18 booking state machine, all six states: not open yet · open · full →
 * waitlist (server decides) · closed · members only → log in / join ·
 * cancelled. Optimistic button state with rollback on failure (§3.5 rule 8).
 */

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { bookEventAction } from '@/lib/actions/bookings'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/format'

type EventInfo = {
  id: string
  status: string
  bookingEnabled: boolean
  bookingOpensAt: string | null
  bookingClosesAt: string | null
  membersOnly: boolean
  startsAt: string
}

export function BookingPanel({
  event,
  signedIn,
  isCurrentMember,
}: {
  event: EventInfo
  signedIn: boolean
  isCurrentMember: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)
  const now = new Date()

  let body: React.ReactNode

  if (event.status === 'cancelled') {
    body = (
      <>
        <h2 className="text-xl">This event is cancelled</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Keep an eye on the events page — sessions come back around quickly.
        </p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="/events">See other events</Link>
        </Button>
      </>
    )
  } else if (!event.bookingEnabled) {
    body = (
      <>
        <h2 className="text-xl">Just turn up</h2>
        <p className="mt-2 text-sm text-ink-muted">
          No booking needed for this one — members can simply come along. If you&apos;re not a
          member yet, join first and say hello when you arrive.
        </p>
        {!isCurrentMember && (
          <Button asChild variant="signal" className="mt-4">
            <Link href="/join">Join the club</Link>
          </Button>
        )}
      </>
    )
  } else if (event.bookingOpensAt && new Date(event.bookingOpensAt) > now) {
    body = (
      <>
        <h2 className="text-xl">Booking opens {formatDateShort(event.bookingOpensAt)}</h2>
        <p className="mt-2 text-sm text-ink-muted">Come back then to grab a place.</p>
      </>
    )
  } else if (event.bookingClosesAt && new Date(event.bookingClosesAt) < now) {
    body = (
      <>
        <h2 className="text-xl">Booking has closed</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Missed it? There&apos;s always the next one on the events page.
        </p>
      </>
    )
  } else if (event.membersOnly && !signedIn) {
    body = (
      <>
        <h2 className="text-xl">Members-only booking</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Log in to book — or join the club and this session (and every other) is included.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="signal">
            <Link href="/join">Join the club</Link>
          </Button>
        </div>
      </>
    )
  } else if (event.membersOnly && !isCurrentMember) {
    body = (
      <>
        <h2 className="text-xl">Booking needs a current membership</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your account isn&apos;t covered by an active membership yet — sort that first and come
          straight back.
        </p>
        <Button asChild variant="signal" className="mt-4">
          <Link href="/members/membership">Choose a membership</Link>
        </Button>
      </>
    )
  } else if (done) {
    body = (
      <>
        <h2 className="text-xl">{done}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Manage your places any time under{' '}
          <Link href="/members/events" className="font-medium text-river underline-offset-4 hover:underline">
            my bookings
          </Link>
          .
        </p>
      </>
    )
  } else {
    body = (
      <>
        <h2 className="text-xl">Booking is open</h2>
        <p className="mt-2 text-sm text-ink-muted">
          If the session is full you&apos;ll join the waitlist and move up automatically when a
          place frees.
        </p>
        <Button
          variant="signal"
          className="mt-4"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await bookEventAction(event.id)
              if (result.ok) {
                setDone(result.message ?? 'Booked')
                toast.success(result.message ?? 'Booked')
              } else {
                toast.error(result.message)
              }
            })
          }
        >
          {pending ? 'Booking…' : 'Book my place'}
        </Button>
      </>
    )
  }

  return <div className="rounded-xl border border-stone bg-foam p-6">{body}</div>
}
