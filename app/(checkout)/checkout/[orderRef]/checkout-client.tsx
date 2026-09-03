'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CircleAlert, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { abandonOnlineOrderAction, captureOnlineOrderAction } from '@/lib/actions/payments'
import { formatMoneyGBP } from '@/lib/format'

export function CheckoutClient({
  orderRef,
  tier,
  periodLabel,
  amountPence,
  payerName,
  payerEmail,
}: {
  orderRef: string
  tier: string
  periodLabel: string
  amountPence: number
  payerName: string
  payerEmail: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [declined, setDeclined] = useState<string | null>(null)
  const [busy, setBusy] = useState<'approve' | 'decline' | 'cancel' | null>(null)

  const run = (kind: 'approve' | 'decline' | 'cancel') =>
    startTransition(async () => {
      setBusy(kind)
      const result =
        kind === 'cancel'
          ? await abandonOnlineOrderAction(orderRef)
          : await captureOnlineOrderAction(orderRef, kind)
      setBusy(null)
      if (result.ok) {
        router.push(result.redirect)
        return
      }
      if (result.declined) {
        setDeclined(result.message)
        return
      }
      toast.error(result.message)
    })

  return (
    <div className="rounded-xl border border-stone bg-card shadow-sm">
      <div className="border-b border-stone p-6">
        <div className="flex items-center gap-2 text-ink-muted">
          <Lock className="size-4" aria-hidden="true" />
          <span className="text-micro font-medium uppercase tracking-wide">Secure checkout · simulation</span>
        </div>
        <h1 className="mt-2 text-2xl">Confirm your payment</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This is the club&apos;s <strong>test gateway</strong> — it behaves like the real card
          flow, but no money moves and no card details are asked for.
        </p>
      </div>

      <dl className="grid gap-3 p-6 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-muted">Order</dt>
          <dd className="font-mono text-micro">{orderRef}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-muted">Membership</dt>
          <dd>
            {tier} · {periodLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-muted">Paying as</dt>
          <dd className="text-right">
            {payerName}
            <span className="block text-micro text-ink-muted">{payerEmail}</span>
          </dd>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-stone pt-3">
          <dt className="font-medium">Total</dt>
          <dd className="font-heading text-2xl font-semibold tabular-nums">
            {formatMoneyGBP(amountPence)}
          </dd>
        </div>
      </dl>

      {declined ? (
        <div className="mx-6 mb-2 rounded-lg border border-signal/40 bg-signal-soft p-4" role="alert">
          <p className="flex items-center gap-2 text-sm font-medium text-signal">
            <CircleAlert className="size-4" aria-hidden="true" /> Payment declined
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {declined}. Nothing was taken — try again, or switch to paying the treasurer by bank
            transfer.
          </p>
        </div>
      ) : null}

      <div className="grid gap-2 p-6 pt-3">
        <Button
          size="lg"
          disabled={pending}
          onClick={() => run('approve')}
          className="bg-success text-white hover:bg-success/90"
        >
          <ShieldCheck aria-hidden="true" />
          {busy === 'approve' ? 'Processing…' : `Approve payment of ${formatMoneyGBP(amountPence)}`}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => run('decline')}>
          <CreditCard aria-hidden="true" />
          {busy === 'decline' ? 'Processing…' : 'Simulate a declined card'}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => run('cancel')}>
          {busy === 'cancel' ? 'Cancelling…' : 'Cancel and pay the treasurer instead'}
        </Button>
      </div>
    </div>
  )
}
