import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'

import { EventsTable } from '@/components/admin/events-table'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { getAdminEvents } from '@/lib/queries/events'

export const metadata: Metadata = { title: 'Events' }

export default async function AdminEventsPage() {
  await requireRole('committee')
  const rows = await getAdminEvents()
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Events</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everything on the club calendar — publish, see who has confirmed, check people in.
          </p>
        </div>
        <Button asChild size="sm" variant="signal">
          <Link href="/admin/events/new">
            <CalendarPlus aria-hidden="true" /> Add an event
          </Link>
        </Button>
      </div>
      <div className="mt-6">
        <EventsTable rows={rows} />
      </div>
    </>
  )
}
