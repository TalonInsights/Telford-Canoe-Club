'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteProductAction, saveProductAction } from '@/lib/actions/merch'
import { formatMoneyGBP } from '@/lib/format'
import type { MerchProduct } from '@/lib/queries/merch'
import { uploadSiteImage } from '@/lib/storage/client-upload'
import { siteImageUrl } from '@/lib/storage/site-images'
import { ClubBadge } from '@/components/site/brand'
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
import { Field } from '@/components/ui/form-field'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * What is on sale. Photographs are still to come from the club, so an item
 * without one still looks deliberate: the badge stands in, and the picture can
 * be added later without touching anything else.
 */

type Draft = {
  id?: string
  slug: string
  name: string
  description: string
  pricePounds: string
  sizes: string
  isActive: boolean
  sortOrder: number
  stockNote: string
  imagePath: string | null
}

const emptyDraft = (nextOrder: number): Draft => ({
  slug: '',
  name: '',
  description: '',
  pricePounds: '',
  sizes: '',
  isActive: true,
  sortOrder: nextOrder,
  stockNote: '',
  imagePath: null,
})

function toDraft(p: MerchProduct): Draft {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description ?? '',
    pricePounds: (p.price_pence / 100).toFixed(2),
    sizes: p.sizes.join(', '),
    isActive: p.is_active,
    sortOrder: p.sort_order,
    stockNote: p.stock_note ?? '',
    imagePath: p.image_path,
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function MerchProductsEditor({ products }: { products: MerchProduct[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      if (!draft) return
      const pounds = Number(draft.pricePounds)
      if (!Number.isFinite(pounds) || pounds < 0) {
        toast.error('Give the item a price, in pounds')
        return
      }
      const result = await saveProductAction({
        id: draft.id,
        slug: draft.slug || slugify(draft.name),
        name: draft.name,
        description: draft.description || null,
        pricePence: Math.round(pounds * 100),
        sizes: draft.sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        imagePath: draft.imagePath,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
        stockNote: draft.stockNote || null,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        setDraft(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = (product: MerchProduct) =>
    startTransition(async () => {
      const result = await deleteProductAction(product.id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-3">
      <ul className="grid gap-3">
        {products.map((product) => {
          const image = siteImageUrl(product.image_path)
          return (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-stone bg-card p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-deep">
                {image ? (
                  <Image src={image} alt="" fill unoptimized sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <ClubBadge className="size-8 text-white/30" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  <span className="font-heading font-semibold tabular-nums">
                    {formatMoneyGBP(product.price_pence)}
                  </span>
                  {!product.is_active && <Badge variant="warn">Not on sale</Badge>}
                  {!product.image_path && (
                    <span className="inline-flex items-center gap-1 text-micro text-ink-muted">
                      <ImageOff aria-hidden="true" className="size-3.5" />
                      No photo yet
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-micro text-ink-muted">
                  {product.sizes.length > 0 ? `Sizes: ${product.sizes.join(', ')}` : 'One size'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(product))}>
                  <Pencil aria-hidden="true" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => remove(product)}
                  aria-label={`Remove ${product.name}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <div>
        <Button
          variant="secondary"
          onClick={() => setDraft(emptyDraft((products.at(-1)?.sort_order ?? 0) + 1))}
        >
          <Plus aria-hidden="true" /> Add an item
        </Button>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? `Edit ${draft.name || 'item'}` : 'Add an item'}</DialogTitle>
            <DialogDescription>
              Members see this in the club shop straight away. Switch an item off rather than
              deleting it if anyone has already ordered one.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
              <Field label="Name" htmlFor="p-name">
                <Input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                    })
                  }
                  placeholder="Club hoodie"
                />
              </Field>

              <Field label="Description" htmlFor="p-desc" optional>
                <Textarea
                  id="p-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price in pounds" htmlFor="p-price">
                  <Input
                    id="p-price"
                    inputMode="decimal"
                    value={draft.pricePounds}
                    onChange={(e) => setDraft({ ...draft, pricePounds: e.target.value })}
                    placeholder="30.00"
                  />
                </Field>
                <Field
                  label="Sizes"
                  htmlFor="p-sizes"
                  optional
                  helper="Separated by commas. Leave blank for one size."
                >
                  <Input
                    id="p-sizes"
                    value={draft.sizes}
                    onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                  />
                </Field>
              </div>

              <Field label="Availability note" htmlFor="p-stock" optional helper="Shown in red under the item.">
                <Input
                  id="p-stock"
                  value={draft.stockNote}
                  onChange={(e) => setDraft({ ...draft, stockNote: e.target.value })}
                  placeholder="e.g. next order goes in at the end of the month"
                />
              </Field>

              <Field label="Photo" htmlFor="p-photo" optional>
                <div className="grid gap-2">
                  {draft.imagePath && (
                    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-stone">
                      <Image
                        src={siteImageUrl(draft.imagePath) ?? ''}
                        alt=""
                        fill
                        unoptimized
                        sizes="400px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <FileUpload
                    accept={['image/jpeg', 'image/png', 'image/webp']}
                    maxSizeMb={10}
                    multiple={false}
                    label={draft.imagePath ? 'Replace the photo' : 'Upload a photo'}
                    hint="JPG, PNG or WebP up to 10MB. Landscape works best."
                    upload={async (file, onProgress) => {
                      onProgress(25)
                      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
                      const path = await uploadSiteImage(
                        `merch/${draft.slug || 'item'}-${Date.now()}.${ext}`,
                        file
                      )
                      onProgress(100)
                      setDraft((d) => (d ? { ...d, imagePath: path } : d))
                    }}
                  />
                  {draft.imagePath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft({ ...draft, imagePath: null })}
                    >
                      Remove the photo
                    </Button>
                  )}
                </div>
              </Field>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-stone p-3">
                <div>
                  <p className="text-sm font-medium">On sale</p>
                  <p className="text-micro text-ink-muted">
                    Switch off to hide it from members without losing the order history.
                  </p>
                </div>
                <Button
                  variant={draft.isActive ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={draft.isActive}
                  onClick={() => setDraft({ ...draft, isActive: !draft.isActive })}
                >
                  {draft.isActive ? 'On sale' : 'Off sale'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button disabled={pending || !draft?.name.trim()} onClick={save}>
              {pending ? 'Saving…' : 'Save item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
