import type { Metadata } from 'next'
import Link from 'next/link'
import { UserRoundPlus } from 'lucide-react'

import { MembersDirectoryTable } from '@/components/admin/members-table'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { getMembersDirectory } from '@/lib/queries/admin'

export const metadata: Metadata = { title: 'Members' }

export default async function AdminMembersPage() {
  await requireRole('committee')
  const rows = await getMembersDirectory()
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Members</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everyone with an account — filter by who has actually paid, export the list, or open a
            record to manage it.
          </p>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/admin/members/new">
            <UserRoundPlus aria-hidden="true" /> Add a membership
          </Link>
        </Button>
      </div>
      <div className="mt-6">
        <MembersDirectoryTable rows={rows} />
      </div>
    </>
  )
}
