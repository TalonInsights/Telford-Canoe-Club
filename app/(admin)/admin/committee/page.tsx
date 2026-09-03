import type { Metadata } from 'next'
import Link from 'next/link'

import { CommitteeEditor } from '@/components/admin/committee-editor'
import { getCommitteeRoles } from '@/lib/queries/committee'

export const metadata: Metadata = { title: 'Committee roles' }

export default async function AdminCommitteePage() {
  const roles = await getCommitteeRoles()
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Committee roles</h1>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            What you save here is what the public{' '}
            <Link href="/about/committee" className="underline underline-offset-2">
              committee page
            </Link>{' '}
            shows. Leave the holder blank to mark a role vacant.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CommitteeEditor roles={roles} />
      </div>
    </>
  )
}
