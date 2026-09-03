import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarClock, Check, CircleAlert, Clock, PartyPopper } from 'lucide-react'

import { getSession } from '@/lib/auth/guards'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { getMyMemberships, getRenewalOffer } from '@/lib/queries/members'
import { getClubSettings } from '@/lib/queries/settings'
import { AbandonOrderButton, PayOnlineButton } from '@/components/members/payment-buttons'
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

export default async function MyMembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  const [{ paid }, memberships, settings, renewal] = await Promise.all([
    searchParams,
    getMyMemberships(),
    getClubSettings(),
    getRenewalOffer(),
  ])

  const active = memberships.find((m) => m.status === 'active')
  const pending = memberships.find((m) => m.status === 'pending')
  const onlineOn = isOnlinePaymentOn(settings.paymentProvider)
  const pendingIsOnline = pending?.source === 'paypal' && pending.paypal_order_id
  const nextPeriodRow = renewal.nextPeriod
    ? memberships.find(
        (m) => m.periodLabel === renewal.nextPeriod!.label && m.status !== 'cancelled'
      )
    : undefined
  const expiringSoon =
    active && renewal.daysLeft !== null && renewal.daysLeft <= 60 && renewal.daysLeft > 0

  return (
    <div className="grid gap-4">
      {paid && active && (
        <div
          className="flex items-start gap-3 rounded-xl border border-success/40 bg-foam p-5"
          role="status"
        >
          <PartyPopper className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-medium text-success">Payment received — welcome aboard!</p>
            <p className="mt-1 text-sm text-ink-muted">
              Your membership is active and the whole members area is open. A receipt is on its
              way to your inbox
              {active.paypal_capture_id && (
                <>
                  {' '}
                  (payment ref <span className="font-mono text-micro">{active.paypal_capture_id}</span>)
                </>
              )}
              .
            </p>
          </div>
        </div>
      )}

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
            {active.paypal_capture_id && (
              <p className="mt-1 text-micro text-ink-muted">
                Payment reference <span className="font-mono">{active.paypal_capture_id}</span>
              </p>
            )}
            {active.covered.length > 1 && (
              <p className="mt-2 text-sm text-ink-muted">
                Covers: {active.covered.map((c) => c.display_name).join(', ')}
              </p>
            )}
            {expiringSoon && !nextPeriodRow && (
              <p className="mt-3 flex items-center gap-2 text-sm text-warn">
                <CalendarClock className="size-4" aria-hidden="true" />
                Expires in {renewal.daysLeft} day{renewal.daysLeft === 1 ? '' : 's'} — renewal is
                open below.
              </p>
            )}
          </>
        ) : pending && pendingIsOnline ? (
          <>
            <Badge variant="signal">
              <Clock /> Online payment started
            </Badge>
            <h2 className="mt-3 text-xl">
              {tierLabel[pending.tier]} membership · {formatMoneyGBP(pending.amount_pence)}
            </h2>
            <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
              You began an online payment but didn&apos;t finish it. Pick it back up — it takes
              seconds and activates instantly — or switch to paying the treasurer.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="signal">
                <Link href={`/checkout/${pending.paypal_order_id}`}>
                  Finish paying online <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <AbandonOrderButton orderRef={pending.paypal_order_id!} />
            </div>
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
            {onlineOn ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Prefer not to wait? Pay online and your membership goes active the moment the
                  payment clears.
                </p>
                <div className="mt-4">
                  <PayOnlineButton
                    membershipId={pending.id}
                    amountLabel={formatMoneyGBP(pending.amount_pence)}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                Paid already? The committee records payments as they arrive — your status updates
                the moment they do.
              </p>
            )}
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

      {/* Renewal (P4-05: next period exists and current ends within 60 days) */}
      {active && renewal.open && renewal.nextPeriod && !nextPeriodRow && (
        <div className="rounded-xl border border-river/40 bg-foam p-6">
          <h2 className="text-lg">Renew for {renewal.nextPeriod.label}</h2>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            Keep your membership rolling into {renewal.nextPeriod.label} — same two-minute flow,
            and nothing changes until the new year starts.
          </p>
          <Button asChild variant="signal" className="mt-4">
            <Link href="/welcome?renew=1">
              Renew now <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}
      {active && nextPeriodRow && renewal.nextPeriod && (
        <div className="rounded-xl border border-stone bg-card p-6">
          <p className="text-sm text-ink-muted">
            {nextPeriodRow.status === 'active' ? (
              <>
                <Check className="mr-1 inline size-4 text-success" aria-hidden="true" />
                You&apos;re already covered for {renewal.nextPeriod.label} — nothing more to do.
              </>
            ) : (
              <>
                Your {renewal.nextPeriod.label} renewal is requested and waiting on payment
                {nextPeriodRow.source === 'paypal' && nextPeriodRow.paypal_order_id ? (
                  <>
                    {' '}
                    — <Link className="underline underline-offset-2" href={`/checkout/${nextPeriodRow.paypal_order_id}`}>finish paying online</Link>.
                  </>
                ) : (
                  '.'
                )}
              </>
            )}
          </p>
        </div>
      )}

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
