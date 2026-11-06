import type { Metadata } from 'next'
import Link from 'next/link'

import { MembershipTypesEditor } from '@/components/admin/membership-types-editor'
import { MembershipYearEditor } from '@/components/admin/membership-year-editor'
import { requireRole } from '@/lib/auth/guards'
import { getAllMembershipTypes } from '@/lib/queries/membership-types'
import { getMembershipPeriods } from '@/lib/queries/membership-periods'

export const metadata: Metadata = { title: 'Memberships on sale' }

export default async function AdminMembershipTypesPage() {
  const [, types, periods] = await Promise.all([
    requireRole('admin'),
    getAllMembershipTypes(),
    getMembershipPeriods(),
  ])

  return (
    <>
      <div>
        <h1 className="text-2xl">Memberships on sale</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          What the club offers and what it costs. Add one here and it appears on the{' '}
          <Link href="/join" className="underline underline-offset-2">
            join page
          </Link>{' '}
          straight away. Every price change is written to the audit log.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-stone bg-card p-4">
        <h2 className="text-lg">How long one lasts</h2>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          Leave the months empty and a membership behaves the way the club&apos;s annual ones
          always have: it runs to the end of the membership year, whenever it was bought. Put a
          number in and it lasts that many months from the day it is paid for, which is how a half
          year works. The end date is fixed at the moment of payment, so editing a type later never
          changes what somebody already bought.
        </p>
      </div>

      <div className="mt-6">
        <MembershipTypesEditor types={types} />
      </div>

      <section className="mt-12">
        <h2 className="text-xl">The membership year</h2>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          When the club&apos;s year starts and ends. Run a calendar year, or set it to something
          like April to March — whatever the club uses. The year marked <strong>current</strong> is
          the one the join page sells and the one renewals count down to. Changing a year never
          alters a membership somebody already bought: each one fixed its own end date when it was
          paid for. The wording shown on the join page is set separately under{' '}
          <Link href="/admin/settings" className="underline underline-offset-2">
            settings
          </Link>
          .
        </p>
        <div className="mt-4">
          <MembershipYearEditor periods={periods} />
        </div>
      </section>
    </>
  )
}
