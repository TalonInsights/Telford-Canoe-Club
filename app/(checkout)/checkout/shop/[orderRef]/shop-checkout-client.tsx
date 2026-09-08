'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CircleAlert, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { abandonShopOrderAction, captureShopOrderAction } from '@/lib/actions/merch'
import { formatMoneyGBP } from '@/lib/format'
import { Button } from '@/components/ui/button'

/**
 * The shop's gateway page, the same three-outcome test bench the membership
 * checkout uses: approve, simulate a decline, or back out. Every button ends in
 * a database function that re-checks who you are, what the order is worth and
 * whether the club is even in simulated mode.
 */
export function ShopCheckoutClient({
  orderRef,
  amountPence,
  lines,
  payerName,
}: {
  orderRef: string
  amountPence: number
  lines: { id: string; label: string; amountPence: number }[]
  payerName: string
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
          ? await abandonShopOrderAction(orderRef)
          : await captureShopOrderAction(orderRef, kind)
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
          <span className="text-micro font-medium tracking-wide uppercase">
            Secure checkout · simulation
          </span>
        </div>
        <h1 className="mt-2 text-2xl">Confirm your order</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This is the club&apos;s <strong>test gateway</strong>. It behaves like the real card
          checkout will, but no money moves.
        </p>
      </div>

      <div className="border-b border-stone p-6">
        <dl className="grid gap-2 text-sm">
          {lines.map((line) => (
            <div key={line.id} className="flex justify-between gap-4">
              <dt className="text-ink-muted">{line.label}</dt>
              <dd className="tabular-nums">{formatMoneyGBP(line.amountPence)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-stone pt-2">
            <dt className="font-medium">Total</dt>
            <dd className="font-heading font-semibold tabular-nums">
              {formatMoneyGBP(amountPence)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Paying as</dt>
            <dd>{payerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Reference</dt>
            <dd className="font-mono text-micro">{orderRef}</dd>
          </div>
        </dl>
      </div>

      {declined && (
        <div className="mx-6 mt-6 flex items-start gap-2 rounded-lg border border-signal/30 bg-signal-soft p-3" role="alert">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal" />
          <p className="text-sm">
            Payment declined: {declined}. Nothing was taken. Try again, or back out and pay at the
            club.
          </p>
        </div>
      )}

      <div className="grid gap-2 p-6">
        <Button disabled={pending} onClick={() => run('approve')}>
          {busy === 'approve' ? 'Taking payment…' : `Approve payment of ${formatMoneyGBP(amountPence)}`}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => run('decline')}>
          {busy === 'decline' ? 'Declining…' : 'Simulate a declined card'}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => run('cancel')}>
          {busy === 'cancel' ? 'Putting it back…' : 'Cancel and keep the basket'}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-micro text-ink-muted">
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          Your order is confirmed by the club&apos;s database, not by this page
        </p>
      </div>
    </div>
  )
}
