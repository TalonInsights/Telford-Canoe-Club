import Link from 'next/link'
import { CalendarDays, Clock, UserRound, Users } from 'lucide-react'

import { StatCard } from '@/components/admin/stat-card'
import { RecordPaymentButton } from '@/components/admin/record-payment'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { formatMoneyGBP } from '@/lib/format'
import { getAdminStats, getMembersDirectory } from '@/lib/queries/admin'

export default async function AdminOverviewPage() {
  await requireRole('committee')
  const [stats, directory] = await Promise.all([getAdminStats(), getMembersDirectory()])
  const pendingRows = directory.filter((r) => r.membership_status === 'pending' && r.membership_id)

  return (
    <>
      <h1 className="text-2xl">Overview</h1>
      <p className="mt-1 text-sm text-ink-muted">
        The membership picture at a glance — the answer to &quot;who has actually paid?&quot;
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Paid members"
          value={stats.activeTotal}
          icon={Users}
          hint={
            Object.entries(stats.activeByTier)
              .map(([tier, n]) => `${n} ${tier}`)
              .join(' · ') || 'Across all tiers'
          }
        />
        <StatCard
          label="Awaiting payment"
          value={stats.pending}
          icon={Clock}
          tone={stats.pending > 0 ? 'warn' : 'neutral'}
          hint="Requested but not yet paid"
        />
        <StatCard
          label="Registered, never paid"
          value={stats.registeredNeverPaid}
          icon={UserRound}
          hint="Accounts with no membership"
        />
        <StatCard label="Upcoming events" value={stats.upcomingEvents} icon={CalendarDays} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">Payments to record</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/members">Full directory</Link>
          </Button>
        </div>
        {pendingRows.length === 0 ? (
          <p className="mt-3 rounded-xl border border-stone bg-card p-5 text-sm text-ink-muted">
            Nothing waiting — every requested membership has been dealt with.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone overflow-hidden rounded-xl border border-stone bg-card">
            {pendingRows.map((r) => (
              <li key={r.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 grow">
                  <Link
                    href={`/admin/members/${r.user_id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {r.first_name} {r.last_name}
                  </Link>
                  <p className="text-micro text-ink-muted">
                    {r.tier} · {r.amount_pence != null ? formatMoneyGBP(r.amount_pence) : ''} ·{' '}
                    {r.email}
                  </p>
                </div>
                <RecordPaymentButton
                  membershipId={r.membership_id as string}
                  memberName={`${r.first_name} ${r.last_name}`}
                  amountPence={r.amount_pence ?? 0}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
