import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, CircleAlert, Clock } from 'lucide-react'

import { getSession } from '@/lib/auth/guards'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { getMyMemberships } from '@/lib/queries/members'
import { getClubSettings } from '@/lib/queries/settings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'My membership' }

const tierLabel: Record<string, string> = { adult: 'Adult', junior: 'Junior', family: 'Family' }

export default async function MyMembershipPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const [memberships, settings] = await Promise.all([getMyMemberships(), getClubSettings()])

  const active = memberships.find((m) => m.status === 'active')
  const pending = memberships.find((m) => m.status === 'pending')

  return (
    <div className="grid gap-4">
      {/* Status card — every §4.3 / P4-05 state */}
      <div className="rounded-xl border border-stone bg-card p-6">
        {active ? (
          <>
            <Badge variant="success">
              <Check /> Active
            </Badge>
            <h2 className="mt-3 text-xl">
              {tierLabel[active.tier]} membership · {active.periodLabel}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Runs to {formatDate(active.periodEndsOn)} · {formatMoneyGBP(active.amount_pence)}
              {active.paid_at && <> · paid {formatDate(active.paid_at)}</>}
            </p>
            {active.covered.length > 1 && (
              <p className="mt-2 text-sm text-ink-muted">
                Covers: {active.covered.map((c) => c.display_name).join(', ')}
              </p>
            )}
          </>
        ) : pending ? (
          <>
            <Badge variant="signal">
              <Clock /> Payment pending
            </Badge>
            <h2 className="mt-3 text-xl">
              {tierLabel[pending.tier]} membership requested · {formatMoneyGBP(pending.amount_pence)}
            </h2>
            <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">{settings.bankPaymentNote}</p>
            <p className="mt-2 text-sm text-ink-muted">
              Paid already? The committee records payments as they arrive — your status updates
              the moment they do.
            </p>
          </>
        ) : (
          <>
            <Badge variant="warn">
              <CircleAlert /> Not active
            </Badge>
            <h2 className="mt-3 text-xl">Your membership isn&apos;t active</h2>
            <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
              Choose a tier and you&apos;re one payment away from every session, club kit and the
              members area. {settings.membershipYearLabel}.
            </p>
            <Button asChild variant="signal" className="mt-4">
              <Link href="/welcome">Choose a tier</Link>
            </Button>
          </>
        )}
      </div>

      {/* History */}
      {memberships.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-stone bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Year</TableHead>
                <TableHead className="px-4">Tier</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Amount</TableHead>
                <TableHead className="px-4">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="px-4">{m.periodLabel}</TableCell>
                  <TableCell className="px-4">{tierLabel[m.tier]}</TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant={
                        m.status === 'active' ? 'success' : m.status === 'pending' ? 'signal' : 'outline'
                      }
                    >
                      {m.status === 'active'
                        ? 'Active'
                        : m.status === 'pending'
                          ? 'Pending'
                          : m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 tabular-nums">{formatMoneyGBP(m.amount_pence)}</TableCell>
                  <TableCell className="px-4">{m.paid_at ? formatDate(m.paid_at) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
