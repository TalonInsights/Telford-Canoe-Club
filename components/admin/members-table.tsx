'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Check, CircleAlert, Clock, Users } from 'lucide-react'

import { DataTable, exportCsv, selectionColumn } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/format'
import type { DirectoryRow } from '@/lib/queries/admin'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'pending' | 'none'
type TierFilter = 'all' | 'adult' | 'junior' | 'family'

function StatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return (
      <Badge variant="success">
        <Check /> Active
      </Badge>
    )
  if (status === 'pending')
    return (
      <Badge variant="signal">
        <Clock /> Pending
      </Badge>
    )
  if (status === 'none')
    return (
      <Badge variant="outline">
        <CircleAlert /> No membership
      </Badge>
    )
  return <Badge variant="outline">{status}</Badge>
}

export function MembersDirectoryTable({ rows }: { rows: DirectoryRow[] }) {
  const router = useRouter()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [tier, setTier] = useState<TierFilter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.membership_status !== status) return false
      if (tier !== 'all' && r.tier !== tier) return false
      if (q && !`${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, status, tier, search])

  const columns: ColumnDef<DirectoryRow>[] = useMemo(
    () => [
      selectionColumn<DirectoryRow>(),
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
        accessorKey: 'membership_status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: 'tier',
        header: 'Tier',
        cell: ({ getValue }) => {
          const t = getValue<string | null>()
          return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—'
        },
      },
      {
        accessorKey: 'bc_membership_number',
        header: 'Paddle UK no.',
        cell: ({ getValue }) => getValue<string | null>() ?? '—',
      },
      {
        accessorKey: 'paid_at',
        header: 'Paid',
        cell: ({ getValue }) => {
          const v = getValue<string | null>()
          return v ? formatDate(v) : '—'
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Joined site',
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
    ],
    []
  )

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-river bg-river text-white' : 'border-stone bg-card text-ink-muted hover:border-river'
      )}
    >
      {label}
    </button>
  )

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No accounts yet"
        description="As people register and join, the whole directory manages itself from this screen."
      />
    )
  }

  return (
    <DataTable<DirectoryRow>
      columns={columns}
      data={filtered}
      countLabel={(n) => `${n} ${n === 1 ? 'person' : 'people'}${status !== 'all' || tier !== 'all' || search ? ' (filtered)' : ''}`}
      onRowClick={(r) => router.push(`/admin/members/${r.user_id}`)}
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search members"
            className="h-11 rounded-(--radius-control) border border-stone bg-card px-3 text-base outline-none focus-visible:border-river focus-visible:ring-3 focus-visible:ring-river/50"
          />
          {chip('Everyone', status === 'all', () => setStatus('all'))}
          {chip('Paid up', status === 'active', () => setStatus('active'))}
          {chip('Awaiting payment', status === 'pending', () => setStatus('pending'))}
          {chip('Never paid', status === 'none', () => setStatus('none'))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-stone" />
          {chip('Adult', tier === 'adult', () => setTier(tier === 'adult' ? 'all' : 'adult'))}
          {chip('Junior', tier === 'junior', () => setTier(tier === 'junior' ? 'all' : 'junior'))}
          {chip('Family', tier === 'family', () => setTier(tier === 'family' ? 'all' : 'family'))}
          {(status !== 'all' || tier !== 'all' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('all')
                setTier('all')
                setSearch('')
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      }
      bulkActions={(selected) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            exportCsv(
              'tcc-members.csv',
              selected.map((r) => ({
                first_name: r.first_name,
                last_name: r.last_name,
                email: r.email,
                status: r.membership_status,
                tier: r.tier ?? '',
                junior: r.is_junior ? 'yes' : 'no',
                paddle_uk: r.bc_membership_number ?? '',
                paid: r.paid_at ?? '',
              }))
            )
          }
        >
          Export CSV
        </Button>
      )}
    />
  )
}
