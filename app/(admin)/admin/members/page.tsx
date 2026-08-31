import type { Metadata } from 'next'

import { MembersDirectoryTable } from '@/components/admin/members-table'
import { requireRole } from '@/lib/auth/guards'
import { getMembersDirectory } from '@/lib/queries/admin'

export const metadata: Metadata = { title: 'Members' }

export default async function AdminMembersPage() {
  await requireRole('committee')
  const rows = await getMembersDirectory()
  return (
    <>
      <h1 className="text-2xl">Members</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Everyone with an account — filter by who has actually paid, export the list, or open a
        record to manage it.
      </p>
      <div className="mt-6">
        <MembersDirectoryTable rows={rows} />
      </div>
    </>
  )
}
