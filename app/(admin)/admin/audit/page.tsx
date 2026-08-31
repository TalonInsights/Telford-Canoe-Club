import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'

import { requireRole } from '@/lib/auth/guards'
import { formatDate, formatTime } from '@/lib/format'
import { getAuditLog } from '@/lib/queries/admin'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Audit log' }

export default async function AuditPage() {
  await requireRole('admin')
  const entries = await getAuditLog(200)

  if (entries.length === 0) {
    return (
      <>
        <h1 className="text-2xl">Audit log</h1>
        <div className="mt-6">
          <EmptyState
            icon={ClipboardList}
            title="Nothing recorded yet"
            description="Every payment recorded, membership change and admin action lands here automatically."
          />
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="text-2xl">Audit log</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every consequential action, oldest to newest — written by the system, never edited.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">When</TableHead>
              <TableHead className="px-4">Action</TableHead>
              <TableHead className="px-4">Entity</TableHead>
              <TableHead className="px-4">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="px-4 whitespace-nowrap">
                  {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                </TableCell>
                <TableCell className="px-4 font-medium">{entry.action}</TableCell>
                <TableCell className="px-4">{entry.entity}</TableCell>
                <TableCell className="max-w-96 truncate px-4 text-micro text-ink-muted">
                  {entry.after ? JSON.stringify(entry.after) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
