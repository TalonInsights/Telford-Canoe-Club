import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, PartyPopper, ShoppingBag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDate, formatMoneyGBP } from '@/lib/format'
import { merchMemberStatusLabel, merchStatusTone, type MerchStatus } from '@/lib/merch/labels'
import { getMyOrders } from '@/lib/queries/merch'

export const metadata: Metadata = { title: 'My orders' }

export default async function MyShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>
}) {
  const [, orders, params] = await Promise.all([
    requireCurrentMember(),
    getMyOrders(),
    searchParams,
  ])
  const justPaid = params.paid === '1'

  return (
    <>
      <Link
        href="/members/shop"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to the shop
      </Link>
      <h1 className="mt-2 text-2xl">My orders</h1>

      {justPaid && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-card p-4">
          <PartyPopper aria-hidden="true" className="size-5 shrink-0 text-success" />
          <div>
            <p className="font-medium text-success">Payment received, thank you</p>
            <p className="mt-1 text-sm text-ink-muted">
              The committee can see your order now. They will let you know when your kit is at the
              club to collect.
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Anything you order from the club shop will be listed here with where it has got to."
            action={
              <Button asChild variant="secondary">
                <Link href="/members/shop">Open the shop</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((order) => {
            const tone = merchStatusTone[order.status as MerchStatus] ?? 'neutral'
            return (
              <li key={order.id} className="rounded-xl border border-stone bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={tone === 'success' ? 'success' : tone === 'warn' ? 'warn' : 'default'}>
                    {merchMemberStatusLabel(order.status)}
                  </Badge>
                  <span className="text-sm text-ink-muted">
                    Ordered {formatDate(order.created_at)}
                  </span>
                  <span className="ml-auto font-heading font-semibold tabular-nums">
                    {formatMoneyGBP(order.total_pence)}
                  </span>
                </div>

                <ul className="mt-2 grid gap-1 text-sm text-ink-muted">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity} × {item.product_name}
                      {item.size ? ` (size ${item.size})` : ''}
                    </li>
                  ))}
                </ul>

                {order.status === 'pending' && order.order_ref && (
                  <div className="mt-3">
                    <Button asChild size="sm">
                      <Link href={`/checkout/shop/${order.order_ref}`}>Finish paying</Link>
                    </Button>
                  </div>
                )}
                {order.committee_note && (
                  <p className="mt-3 rounded-lg bg-foam p-2 text-micro text-ink-muted">
                    From the committee: {order.committee_note}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
