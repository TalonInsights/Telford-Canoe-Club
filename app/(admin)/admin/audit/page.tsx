import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'

import { AuditLog } from '@/components/admin/audit-log'
import { requireRole } from '@/lib/auth/guards'
import { getAuditEntries, getPersonName, isAuditCategory } from '@/lib/queries/audit'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Change log' }

const PAGE = 200

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; days?: string; person?: string; show?: string }>
}) {
  await requireRole('admin')
  const sp = await searchParams

  const category = isAuditCategory(sp.category) ? sp.category : undefined
  const days = Number(sp.days) > 0 ? Number(sp.days) : undefined
  const personId = /^[0-9a-f-]{36}$/i.test(sp.person ?? '') ? sp.person : undefined
  const show = Math.min(Math.max(Number(sp.show) || PAGE, PAGE), 2000)

  const [{ entries, total, today, yesterday }, personName] = await Promise.all([
    getAuditEntries({ category, days, personId, limit: show }),
    personId ? getPersonName(personId) : Promise.resolve(null),
  ])

  const unfiltered = !category && !days && !personId

  return (
    <>
      <h1 className="text-2xl">Change log</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Every consequential action on the site, newest first, written by the system and never
        edited. Nobody can change what is recorded here, including an admin.
      </p>

      {total === 0 && unfiltered ? (
        <div className="mt-6">
          <EmptyState
            icon={ClipboardList}
            title="Nothing recorded yet"
            description="Record changes, payments, membership changes and admin actions all land here automatically."
          />
        </div>
      ) : (
        <AuditLog
          entries={entries}
          total={total}
          filter={{ category, days, personId, show }}
          personName={personName}
          today={today}
          yesterday={yesterday}
        />
      )}
    </>
  )
}
