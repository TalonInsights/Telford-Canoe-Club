import type { Metadata } from 'next'

import { MerchOrders } from '@/components/admin/merch-orders'
import { MerchProductsEditor } from '@/components/admin/merch-products-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requireRole } from '@/lib/auth/guards'
import { formatMoneyGBP } from '@/lib/format'
import { getAdminOrders, getProducts } from '@/lib/queries/merch'

export const metadata: Metadata = { title: 'Club shop' }

export default async function AdminShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [, { tab }, orders, products] = await Promise.all([
    requireRole('committee'),
    searchParams,
    getAdminOrders(),
    getProducts({ includeInactive: true }),
  ])

  const waiting = orders.filter((o) => o.status === 'pending' || o.status === 'paid')
  const toHandOver = orders.filter((o) => o.status === 'paid')
  const takings = orders
    .filter((o) => o.status === 'paid' || o.status === 'fulfilled')
    .reduce((sum, o) => sum + o.total_pence, 0)

  return (
    <>
      <div>
        <h1 className="text-2xl">Club shop</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          What members have ordered, and what is on sale. Orders paid online arrive here already
          marked paid; kit paid for at the club is recorded by hand.
        </p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone bg-card p-4">
          <dt className="text-micro text-ink-muted">Needs something</dt>
          <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {waiting.length}
          </dd>
        </div>
        <div className="rounded-xl border border-stone bg-card p-4">
          <dt className="text-micro text-ink-muted">Paid, to hand over</dt>
          <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {toHandOver.length}
          </dd>
        </div>
        <div className="rounded-xl border border-stone bg-card p-4">
          <dt className="text-micro text-ink-muted">Taken so far</dt>
          <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {formatMoneyGBP(takings)}
          </dd>
        </div>
      </dl>

      <Tabs defaultValue={tab === 'items' ? 'items' : 'orders'} className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">
            Orders <span className="ml-1 tabular-nums">({orders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="items">
            What we sell <span className="ml-1 tabular-nums">({products.length})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="pt-4">
          <MerchOrders orders={orders} />
        </TabsContent>
        <TabsContent value="items" className="pt-4">
          <MerchProductsEditor products={products} />
        </TabsContent>
      </Tabs>
    </>
  )
}
