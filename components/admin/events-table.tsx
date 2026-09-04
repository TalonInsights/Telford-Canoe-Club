'use client'

/** P5-01 — the committee's event list on the sourced DataTable: upcoming / past / drafts. */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'

import { DataTable } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { eventCategoryLabel } from '@/lib/events/labels'
import { formatDateTimeRange } from '@/lib/format'
import type { AdminEventRow } from '@/lib/queries/events'
import { cn } from '@/lib/utils'

type Tab = 'upcoming' | 'past' | 'drafts'

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') return <Badge variant="success">Published</Badge>
  if (status === 'cancelled') return <Badge variant="signal">Cancelled</Badge>
  return <Badge variant="outline">Draft</Badge>
}

export function EventsTable({ rows }: { rows: AdminEventRow[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [now] = useState(() => Date.now())

  const buckets = useMemo(() => {
    const upcoming = rows
      .filter((r) => r.status !== 'draft' && Date.parse(r.starts_at) >= now)
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    const past = rows.filter((r) => r.status !== 'draft' && Date.parse(r.starts_at) < now)
    const drafts = rows.filter((r) => r.status === 'draft')
    return { upcoming, past, drafts }
  }, [rows, now])

  const columns: ColumnDef<AdminEventRow>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Event',
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.title}
            {row.original.visibility === 'members' && (
              <Badge variant="outline" className="ml-2">
                Members only
              </Badge>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'starts_at',
        header: 'When',
        cell: ({ row }) => formatDateTimeRange(row.original.starts_at, row.original.ends_at),
      },
      {
        accessorKey: 'category',
        header: 'Type',
        cell: ({ getValue }) => eventCategoryLabel[getValue<string>()] ?? 'Event',
      },
      {
        id: 'attendance',
        header: 'Confirmed',
        accessorFn: (r) => r.confirmed,
        cell: ({ row }) => {
          const r = row.original
          if (!r.booking_enabled) return <span className="text-ink-muted">Turn up</span>
          return (
            <span className="tabular-nums">
              {r.confirmed}
              {r.capacity != null && <span className="text-ink-muted"> / {r.capacity}</span>}
              {r.waitlist > 0 && <span className="text-ink-muted"> · {r.waitlist} waiting</span>}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
    ],
    []
  )

  const chip = (label: string, value: Tab, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        tab === value ? 'border-river bg-river text-white' : 'border-stone bg-card text-ink-muted hover:border-river'
      )}
    >
      {label} <span className="tabular-nums">({count})</span>
    </button>
  )

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No events yet"
        description="Add the first club night, pool session or trip and it appears across the site the moment you publish."
        action={
          <Button asChild variant="signal">
            <Link href="/admin/events/new">Add an event</Link>
          </Button>
        }
      />
    )
  }

  const data = buckets[tab]

  return (
    <DataTable<AdminEventRow>
      columns={columns}
      data={data}
      countLabel={(n) => `${n} ${n === 1 ? 'event' : 'events'}`}
      onRowClick={(r) => router.push(`/admin/events/${r.id}`)}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          {chip('Upcoming', 'upcoming', buckets.upcoming.length)}
          {chip('Past', 'past', buckets.past.length)}
          {chip('Drafts', 'drafts', buckets.drafts.length)}
        </div>
      }
      emptyState={
        <EmptyState
          icon={CalendarDays}
          title={tab === 'drafts' ? 'No drafts' : tab === 'past' ? 'No past events' : 'Nothing coming up'}
          description={tab === 'upcoming' ? 'Add an event and publish it to fill the calendar.' : undefined}
          className="min-h-[200px]"
        />
      }
    />
  )
}
