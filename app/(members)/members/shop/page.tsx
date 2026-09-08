import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

import { ShopClient } from '@/components/members/shop-client'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { requireCurrentMember } from '@/lib/auth/guards'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { getMyBasket, getProducts } from '@/lib/queries/merch'
import { getClubSettings } from '@/lib/queries/settings'

export const metadata: Metadata = { title: 'Club shop' }

export default async function MemberShopPage() {
  const [, products, basket, settings] = await Promise.all([
    requireCurrentMember(),
    getProducts(),
    getMyBasket(),
    getClubSettings(),
  ])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Club shop</h1>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            Club kit, ordered here and handed over at the club. Members only.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/members/shop/orders">My orders</Link>
        </Button>
      </div>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nothing in the shop yet"
            description="The committee is still setting the kit up. Check back shortly."
          />
        ) : (
          <ShopClient
            products={products}
            basket={basket}
            onlinePaymentOn={isOnlinePaymentOn(settings.paymentProvider)}
            bankNote={settings.bankPaymentNote}
          />
        )}
      </div>
    </>
  )
}
