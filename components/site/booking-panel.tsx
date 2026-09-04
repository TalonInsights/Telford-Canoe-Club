'use client'

/**
 * P2-18 booking state machine, all states: cancelled · just turn up · you're
 * confirmed · you're on the waitlist · not open yet · closed · members only →
 * log in / join · open (confirm or join the waitlist — the database decides,
 * P5-04). Optimistic button state with rollback on failure (§3.5 rule 8); the
 * server re-renders the member's real state after each action.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

import { bookEventAction } from '@/lib/actions/bookings'
import { CancelBookingButton } from '@/components/members/cancel-booking'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/format'
import type { Attendance, MyBooking } from '@/lib/queries/events'

type EventInfo = {
  id: string
  status: string
  bookingEnabled: boolean
  bookingOpensAt: string | null
  bookingClosesAt: string | null
  membersOnly: boolean
  startsAt: string
}

function countLine(a: Attendance | null): string | null {
  if (!a) return null
  const left = a.capacity != null ? a.capacity - a.confirmed : null
  return (
    `${a.confirmed} confirmed` +
    (left != null ? (left > 0 ? ` · ${left} ${left === 1 ? 'place' : 'places'} left` : ' · full') : '') +
    (a.waitlist > 0 ? ` · ${a.waitlist} on the waitlist` : '')
  )
}

export function BookingPanel({
  event,
  signedIn,
  isCurrentMember,
  myBooking = null,
  attendance = null,
}: {
  event: EventInfo
  signedIn: boolean
  isCurrentMember: boolean
  myBooking?: MyBooking | null
  attendance?: Attendance | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<string | null>(null)
  const now = new Date()
  const counts = countLine(attendance)
  const full = attendance?.capacity != null && attendance.confirmed >= attendance.capacity
  const started = new Date(event.startsAt) < now

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
          No need to confirm for this one — members can simply come along. If you&apos;re not a
          member yet, join first and say hello when you arrive.
        </p>
        {!isCurrentMember && (
          <Button asChild variant="signal" className="mt-4">
            <Link href="/join">Join the club</Link>
          </Button>
        )}
      </>
    )
  } else if (myBooking && (myBooking.status === 'booked' || myBooking.status === 'attended')) {
    body = (
      <>
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="size-4" aria-hidden="true" /> You&apos;re confirmed
        </p>
        <h2 className="mt-1 text-xl">See you there</h2>
        {counts && <p className="mt-2 text-sm text-ink-muted">{counts}</p>}
        <p className="mt-2 text-sm text-ink-muted">
          Plans changed? Free the place so someone else can have it.
        </p>
        {!started && (
          <div className="mt-3">
            <CancelBookingButton bookingId={myBooking.id} label="Cancel my place" />
          </div>
        )}
      </>
    )
  } else if (myBooking && myBooking.status === 'waitlist') {
    body = (
      <>
        <p className="flex items-center gap-2 text-sm font-medium text-warn">
          <Clock className="size-4" aria-hidden="true" /> You&apos;re on the waitlist
        </p>
        <h2 className="mt-1 text-xl">We&apos;ll email you if a place frees up</h2>
        {counts && <p className="mt-2 text-sm text-ink-muted">{counts}</p>}
        <div className="mt-3">
          <CancelBookingButton bookingId={myBooking.id} label="Leave the waitlist" waitlist />
        </div>
      </>
    )
  } else if (event.bookingOpensAt && new Date(event.bookingOpensAt) > now) {
    body = (
      <>
        <h2 className="text-xl">Confirmations open {formatDateShort(event.bookingOpensAt)}</h2>
        <p className="mt-2 text-sm text-ink-muted">Come back then to grab a place.</p>
      </>
    )
  } else if ((event.bookingClosesAt && new Date(event.bookingClosesAt) < now) || started) {
    body = (
      <>
        <h2 className="text-xl">Confirmations have closed</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Missed it? There&apos;s always the next one on the events page.
        </p>
      </>
    )
  } else if (event.membersOnly && !signedIn) {
    body = (
      <>
        <h2 className="text-xl">Members confirm their place here</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Log in to say you&apos;re coming — or join the club and this session (and every other) is
          included.
        </p>
        {counts && <p className="mt-2 text-sm text-ink-muted">{counts}</p>}
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
        <h2 className="text-xl">Confirming needs a current membership</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your account isn&apos;t covered by an active membership yet — sort that first and come
          straight back.
        </p>
        <Button asChild variant="signal" className="mt-4">
          <Link href="/members/membership">Choose a membership</Link>
        </Button>
      </>
    )
  } else if (!signedIn) {
    body = (
      <>
        <h2 className="text-xl">Say you&apos;re coming</h2>
        <p className="mt-2 text-sm text-ink-muted">
          This one is open to anyone with an account. Log in or register to confirm a place.
        </p>
        {counts && <p className="mt-2 text-sm text-ink-muted">{counts}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="signal">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
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
        <p className="flex items-center gap-2 text-sm font-medium text-river">
          <Users className="size-4" aria-hidden="true" /> {counts ?? 'Confirmations open'}
        </p>
        <h2 className="mt-1 text-xl">{full ? 'Full — join the waitlist' : 'Are you coming?'}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {full
            ? 'If a place frees up you move in automatically and we email you.'
            : 'One tap tells the committee to expect you. Change your mind later from my bookings.'}
        </p>
        <Button
          variant="signal"
          className="mt-4"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await bookEventAction(event.id)
              if (result.ok) {
                setDone(result.message ?? "You're confirmed")
                toast.success(result.message ?? "You're confirmed")
                router.refresh()
              } else {
                toast.error(result.message)
              }
            })
          }
        >
          {pending ? 'Confirming…' : full ? 'Join the waitlist' : "I'm coming — confirm my place"}
        </Button>
      </>
    )
  }

  return <div className="rounded-xl border border-stone bg-foam p-6">{body}</div>
}
