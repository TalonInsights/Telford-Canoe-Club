'use client'

/**
 * P5-07 — who is coming. Same sourced DataTable as the members directory
 * (shadcn/TanStack, docs/components.md): sortable, sticky header, selection +
 * CSV export. Check-in, no-show and remove act per row and re-render the
 * server counts.
 */

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Check, Clock, Users, UserX } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, exportCsv, selectionColumn } from '@/components/admin/data-table'
import { adminCancelBookingAction, setAttendeeStatusAction } from '@/lib/actions/events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDateShort, formatTime } from '@/lib/format'
import type { Attendance, AttendeeRow } from '@/lib/queries/events'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'confirmed' | 'waitlist' | 'cancelled'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'booked':
      return (
        <Badge variant="success">
          <Check /> Confirmed
        </Badge>
      )
    case 'attended':
      return (
        <Badge variant="success">
          <Check /> Checked in
        </Badge>
      )
    case 'waitlist':
      return (
        <Badge variant="signal">
          <Clock /> Waitlist
        </Badge>
      )
    case 'no_show':
      return (
        <Badge variant="warn">
          <UserX /> No-show
        </Badge>
      )
    default:
      return <Badge variant="outline">Cancelled</Badge>
  }
}

function RowActions({ row }: { row: AttendeeRow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [removeOpen, setRemoveOpen] = useState(false)

  const setStatus = (status: 'booked' | 'attended' | 'no_show') =>
    startTransition(async () => {
      const result = await setAttendeeStatusAction({ bookingId: row.id, status })
      if (result.ok) {
        toast.success(result.message ?? 'Updated')
        router.refresh()
      } else toast.error(result.message)
    })

  const remove = () =>
    startTransition(async () => {
      const result = await adminCancelBookingAction(row.id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
        setRemoveOpen(false)
        router.refresh()
      } else toast.error(result.message)
    })

  if (row.status === 'cancelled') return <span className="text-micro text-ink-muted">—</span>

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {row.status === 'booked' && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus('attended')}>
          Check in
        </Button>
      )}
      {row.status === 'attended' && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus('booked')}>
          Undo check-in
        </Button>
      )}
      {row.status === 'booked' && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus('no_show')}>
          No-show
        </Button>
      )}
      {row.status === 'no_show' && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus('booked')}>
          Back to confirmed
        </Button>
      )}
      {(row.status === 'booked' || row.status === 'waitlist' || row.status === 'attended') && (
        <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-signal hover:text-signal">
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Remove {row.first_name} {row.last_name}&apos;s place?
              </DialogTitle>
              <DialogDescription>
                They&apos;ll be emailed that the club cancelled their place. If there&apos;s a
                waitlist, the next person moves up and is told too.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" disabled={pending} onClick={remove}>
                {pending ? 'Removing…' : 'Remove place'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export function AttendeesTable({
  rows,
  attendance,
  eventTitle,
}: {
  rows: AttendeeRow[]
  attendance: Attendance | null
  eventTitle: string
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === 'confirmed') return r.status === 'booked' || r.status === 'attended'
        if (filter === 'waitlist') return r.status === 'waitlist'
        if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'no_show'
        return true
      }),
    [rows, filter]
  )

  const columns: ColumnDef<AttendeeRow>[] = useMemo(
    () => [
      selectionColumn<AttendeeRow>(),
      {
        id: 'name',
        header: 'Name',
        accessorFn: (r) => `${r.last_name}, ${r.first_name}`,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
            {row.original.is_junior && (
              <Badge variant="outline" className="ml-2">
                Junior
              </Badge>
            )}
          </span>
        ),
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => getValue<string | null>() ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: 'booked_at',
        header: 'Confirmed',
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return `${formatDateShort(v)} ${formatTime(v)}`
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row.original} />,
        enableSorting: false,
      },
    ],
    []
  )

  const chip = (label: string, value: Filter, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        filter === value
          ? 'border-river bg-river text-white'
          : 'border-stone bg-card text-ink-muted hover:border-river'
      )}
    >
      {label} <span className="tabular-nums">({count})</span>
    </button>
  )

  const counts = {
    all: rows.length,
    confirmed: rows.filter((r) => r.status === 'booked' || r.status === 'attended').length,
    waitlist: rows.filter((r) => r.status === 'waitlist').length,
    cancelled: rows.filter((r) => r.status === 'cancelled' || r.status === 'no_show').length,
  }

  const toCsv = (list: AttendeeRow[]) =>
    list.map((r) => ({
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      phone: r.phone ?? '',
      status: r.status,
      confirmed_at: r.booked_at,
      checked_in_at: r.checked_in_at ?? '',
    }))

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nobody has confirmed yet"
        description="As members press “I'm coming” on the event page, they appear here with their contact details."
      />
    )
  }

  const summary = attendance
    ? `${attendance.confirmed} confirmed` +
      (attendance.capacity != null ? ` of ${attendance.capacity} places` : '') +
      (attendance.waitlist > 0 ? ` · ${attendance.waitlist} on the waitlist` : '')
    : null

  return (
    <div className="grid gap-4">
      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone bg-card px-4 py-3">
          <p className="text-sm">
            <span className="font-heading text-lg font-semibold">{summary}</span>
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv(`${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-attendees.csv`, toCsv(filtered))}
          >
            Export list (CSV)
          </Button>
        </div>
      )}
      <DataTable<AttendeeRow>
        columns={columns}
        data={filtered}
        countLabel={(n) => `${n} ${n === 1 ? 'person' : 'people'}`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {chip('Everyone', 'all', counts.all)}
            {chip('Confirmed', 'confirmed', counts.confirmed)}
            {chip('Waitlist', 'waitlist', counts.waitlist)}
            {chip('Cancelled and no-shows', 'cancelled', counts.cancelled)}
          </div>
        }
        bulkActions={(selected) => (
          <Button size="sm" variant="outline" onClick={() => exportCsv('attendees-selected.csv', toCsv(selected))}>
            Export selected
          </Button>
        )}
      />
    </div>
  )
}
