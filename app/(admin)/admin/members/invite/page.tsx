import type { Metadata } from 'next'

import { InviteMembers } from '@/components/admin/invite-members'
import { requireRole } from '@/lib/auth/guards'

export const metadata: Metadata = { title: 'Import members' }

export default async function ImportMembersPage() {
  await requireRole('admin')

  return (
    <>
      <div>
        <h1 className="text-2xl">Import members</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          Create accounts for existing members from the old member list, so they don&apos;t have to
          register themselves. Check the list first — that changes nothing — then create. Each
          person can be sent a link to set their own password, but that stays off until you mean to
          contact real members, and only sends once the club email is live.
        </p>
      </div>
      <div className="mt-6">
        <InviteMembers />
      </div>
    </>
  )
}
