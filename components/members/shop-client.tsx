'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  addToBasketAction,
  setBasketItemQuantityAction,
  startShopCheckoutAction,
} from '@/lib/actions/merch'
import type { MerchOrder, MerchProduct } from '@/lib/queries/merch'
import { formatMoneyGBP } from '@/lib/format'
import { siteImageUrl } from '@/lib/storage/site-images'
import { ClubBadge } from '@/components/site/brand'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * The club shop. Prices shown here are only ever labels: what a member pays is
 * recomputed in the database from the products table when the order is placed,
 * so nothing in this component is trusted with money.
 */

function ProductCard({ product, onAdded }: { product: MerchProduct; onAdded: () => void }) {
  const [pending, startTransition] = useTransition()
  const [size, setSize] = useState<string>(product.sizes[0] ?? '')
  const image = siteImageUrl(product.image_path)

  const add = () =>
    startTransition(async () => {
      const result = await addToBasketAction({
        productId: product.id,
        size: product.sizes.length > 0 ? size : null,
        quantity: 1,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        onAdded()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-stone bg-card">
      <div className="relative aspect-[3/2] w-full bg-deep">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 340px, 100vw"
            className="object-cover"
          />
        ) : (
          // Photographs are still to come from the club, so the badge stands in
          // rather than a grey box with a broken-image icon.
          <span className="flex size-full items-center justify-center">
            <ClubBadge className="size-20 text-white/25" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg">{product.name}</h3>
          <span className="font-heading font-semibold">{formatMoneyGBP(product.price_pence)}</span>
        </div>
        {product.description && (
          <p className="mt-2 text-sm text-ink-muted">{product.description}</p>
        )}
        {product.stock_note && <p className="mt-2 text-micro text-warn">{product.stock_note}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {product.sizes.length > 0 && (
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-[120px]" aria-label={`Size for ${product.name}`}>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            className="flex-1"
            disabled={pending || (product.sizes.length > 0 && !size)}
            onClick={add}
          >
            {pending ? 'Adding…' : 'Add to basket'}
          </Button>
        </div>
      </div>
    </article>
  )
}

function BasketRow({ item, onChanged }: { item: MerchOrder['items'][number]; onChanged: () => void }) {
  const [pending, startTransition] = useTransition()

  const setQuantity = (quantity: number) =>
    startTransition(async () => {
      const result = await setBasketItemQuantityAction({ itemId: item.id, quantity })
      if (result.ok) onChanged()
      else toast.error(result.message)
    })

  return (
    <li className="flex items-center gap-3 border-b border-stone py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.product_name}</p>
        <p className="text-micro text-ink-muted">
          {item.size ? `Size ${item.size} · ` : ''}
          {formatMoneyGBP(item.unit_price_pence)} each
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setQuantity(item.quantity - 1)}
          aria-label={`One fewer ${item.product_name}`}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="w-6 text-center tabular-nums">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={pending || item.quantity >= 20}
          onClick={() => setQuantity(item.quantity + 1)}
          aria-label={`One more ${item.product_name}`}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setQuantity(0)}
          aria-label={`Remove ${item.product_name}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <span className="w-16 shrink-0 text-right font-medium tabular-nums">
        {formatMoneyGBP(item.unit_price_pence * item.quantity)}
      </span>
    </li>
  )
}

export function ShopClient({
  products,
  basket,
  onlinePaymentOn,
  bankNote,
}: {
  products: MerchProduct[]
  basket: MerchOrder | null
  onlinePaymentOn: boolean
  bankNote: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const refresh = () => router.refresh()

  const items = basket?.items ?? []
  const total = items.reduce((sum, i) => sum + i.unit_price_pence * i.quantity, 0)

  const checkout = () =>
    startTransition(async () => {
      if (!basket) return
      const result = await startShopCheckoutAction(basket.id)
      if (result.ok) router.push(result.redirect)
      else toast.error(result.message)
    })

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdded={refresh} />
          ))}
        </div>
      </div>

      <aside className="lg:col-span-4">
        <div className="rounded-xl border border-stone bg-card p-5 lg:sticky lg:top-20">
          <h2 className="flex items-center gap-2 text-lg">
            <ShoppingBag aria-hidden="true" className="size-5 text-river" />
            Your basket
          </h2>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Nothing in it yet. Add something from the left and it will appear here.
            </p>
          ) : (
            <>
              <ul className="mt-3">
                {items.map((item) => (
                  <BasketRow key={item.id} item={item} onChanged={refresh} />
                ))}
              </ul>

              <div className="mt-4 flex items-baseline justify-between border-t border-stone pt-3">
                <span className="font-medium">Total</span>
                <span className="font-heading text-lg font-semibold tabular-nums">
                  {formatMoneyGBP(total)}
                </span>
              </div>

              {onlinePaymentOn ? (
                <Button className="mt-4 w-full" disabled={pending} onClick={checkout}>
                  {pending ? 'Opening the checkout…' : 'Pay for these'}
                </Button>
              ) : (
                <p className="mt-4 rounded-lg bg-foam p-3 text-sm text-ink-muted">{bankNote}</p>
              )}

              <p className="mt-3 text-micro text-ink-muted">
                Club kit is handed over at the club, there is no postage. The committee will let you
                know when yours is in.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
