import type { Metadata } from 'next'
import Link from 'next/link'
import { randomUUID } from 'node:crypto'

import { EventForm } from '@/components/admin/event-form'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'

export const metadata: Metadata = { title: 'Add an event' }

export default async function NewEventPage() {
  await requireRole('committee')
  // The id is minted here so the cover photo has a storage home before the row exists.
  const eventId = randomUUID()
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Add an event</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Title, time, place and a picture — publish when it&apos;s ready and members can confirm
            they&apos;re coming.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/events">Back to events</Link>
        </Button>
      </div>
      <div className="mt-6">
        <EventForm eventId={eventId} mode="create" />
      </div>
    </>
  )
}
