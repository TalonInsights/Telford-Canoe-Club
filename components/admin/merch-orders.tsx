'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, Mail, Phone, ShoppingBag, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { recordShopPaymentAction, setOrderStatusAction } from '@/lib/actions/merch'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { merchStatusLabel, merchStatusTone, type MerchStatus } from '@/lib/merch/labels'
import type { AdminMerchOrder } from '@/lib/queries/merch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * The committee's queue: who has ordered what, whether it is paid, and whether
 * it has been handed over. Every button here calls a definer function that
 * re-checks the committee role in the database, so the UI is a convenience and
 * not the control.
 */

type Filter = 'open' | 'pending' | 'paid' | 'fulfilled' | 'all'

const filterLabels: Record<Filter, string> = {
  open: 'Needs something',
  pending: 'Awaiting payment',
  paid: 'To hand over',
  fulfilled: 'Handed over',
  all: 'Everything',
}

function matches(filter: Filter, status: string): boolean {
  if (filter === 'all') return true
  if (filter === 'open') return status === 'pending' || status === 'paid'
  return status === filter
}

function RecordPaymentDialog({ order, onDone }: { order: AdminMerchOrder; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<'manual_cash' | 'manual_bank' | 'complimentary'>(
    'manual_cash'
  )
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const result = await recordShopPaymentAction({ orderId: order.id, source, note })
      if (result.ok) {
        toast.success(result.message ?? 'Recorded')
        setOpen(false)
        onDone()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Record payment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              For kit paid for at the club rather than online. This marks the order paid and is
              written to the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="How it was paid" htmlFor="merch-source">
              <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                <SelectTrigger id="merch-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_cash">Cash</SelectItem>
                  <SelectItem value="manual_bank">Bank transfer</SelectItem>
                  <SelectItem value="complimentary">Given free</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Note" htmlFor="merch-note" optional>
              <Input
                id="merch-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. paid at club night"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button disabled={pending} onClick={save}>
              {pending ? 'Saving…' : 'Record it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OrderCard({ order, onDone }: { order: AdminMerchOrder; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const tone = merchStatusTone[order.status as MerchStatus] ?? 'neutral'

  const setStatus = (status: 'paid' | 'fulfilled' | 'cancelled' | 'refunded') =>
    startTransition(async () => {
      const result = await setOrderStatusAction({ orderId: order.id, status })
      if (result.ok) {
        toast.success(result.message ?? 'Updated')
        onDone()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <li className="rounded-xl border border-stone bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={tone === 'success' ? 'success' : tone === 'warn' ? 'warn' : 'default'}>
          {merchStatusLabel(order.status)}
        </Badge>
        <span className="font-medium">{order.buyer?.name ?? 'Member'}</span>
        <span className="text-sm text-ink-muted">{formatDate(order.created_at)}</span>
        <span className="ml-auto font-heading font-semibold tabular-nums">
          {formatMoneyGBP(order.total_pence)}
        </span>
      </div>

      <ul className="mt-2 grid gap-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity} × {item.product_name}
            {item.size ? ` (size ${item.size})` : ''}
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-ink-muted">
        {order.buyer?.email && (
          <a href={`mailto:${order.buyer.email}`} className="inline-flex items-center gap-1 hover:underline">
            <Mail aria-hidden="true" className="size-3.5" />
            {order.buyer.email}
          </a>
        )}
        {order.buyer?.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone aria-hidden="true" className="size-3.5" />
            {order.buyer.phone}
          </span>
        )}
        {order.paid_at && <span>Paid {formatDate(order.paid_at)}</span>}
        {order.fulfilled_at && <span>Handed over {formatDate(order.fulfilled_at)}</span>}
        {order.order_ref && <span className="font-mono">{order.order_ref}</span>}
      </div>

      {order.committee_note && (
        <p className="mt-2 rounded-lg bg-foam p-2 text-micro text-ink-muted">
          {order.committee_note}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {order.status === 'pending' && (
          <>
            <RecordPaymentDialog order={order} onDone={onDone} />
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setStatus('cancelled')}
            >
              Cancel order
            </Button>
          </>
        )}
        {order.status === 'paid' && (
          <>
            <Button size="sm" disabled={pending} onClick={() => setStatus('fulfilled')}>
              <Check aria-hidden="true" /> Handed over
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setStatus('refunded')}
            >
              Refunded
            </Button>
          </>
        )}
        {order.status === 'fulfilled' && (
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setStatus('paid')}>
            <Undo2 aria-hidden="true" /> Not handed over after all
          </Button>
        )}
      </div>
    </li>
  )
}

export function MerchOrders({ orders }: { orders: AdminMerchOrder[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('open')
  const shown = orders.filter((o) => matches(filter, o.status))
  const refresh = () => router.refresh()

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as Filter[]).map((key) => {
          const count = orders.filter((o) => matches(key, o.status)).length
          return (
            <Button
              key={key}
              variant={filter === key ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {filterLabels[key]} ({count})
            </Button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={filter === 'open' ? 'Nothing waiting' : 'Nothing here'}
          description={
            filter === 'open'
              ? 'Every order has been paid for and handed over.'
              : 'No orders match this filter yet.'
          }
        />
      ) : (
        <ul className="grid gap-3">
          {shown.map((order) => (
            <OrderCard key={order.id} order={order} onDone={refresh} />
          ))}
        </ul>
      )}
    </div>
  )
}
