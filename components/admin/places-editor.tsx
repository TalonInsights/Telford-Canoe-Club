'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  deletePlaceAction,
  reorderPlacesAction,
  savePlaceAction,
  setPlacePhotoAction,
} from '@/lib/actions/paddle-places'
import type { PaddlePlace, PlaceCategory, PlaceLink } from '@/lib/queries/paddle-places'
import { SITE_IMAGES_BUCKET, placePhotoPath, siteImageUrl } from '@/lib/storage/site-images'
import { removeFromBucket, uploadToBucket } from '@/lib/storage/client-upload'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

/**
 * "Where we paddle", for the committee. Each place is edited in place — name,
 * which kind it is, the blurb, its links and a photo — and the whole list is
 * reorderable. Photos upload straight to storage from the browser, then the
 * row records the path.
 */

type Draft = {
  name: string
  category: PlaceCategory
  description: string
  links: PlaceLink[]
  isPublished: boolean
}

const categoryLabel: Record<PlaceCategory, string> = {
  artificial: 'Artificial course',
  natural: 'Natural river',
}

function LinksField({ links, onChange }: { links: PlaceLink[]; onChange: (l: PlaceLink[]) => void }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Links</span>
      {links.map((link, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Input
            aria-label={`Link ${i + 1} label`}
            placeholder="Label, e.g. Centre website"
            className="w-44"
            value={link.label}
            onChange={(e) => onChange(links.map((l, n) => (n === i ? { ...l, label: e.target.value } : l)))}
          />
          <Input
            aria-label={`Link ${i + 1} address`}
            placeholder="https://…"
            className="min-w-48 flex-1"
            value={link.url}
            onChange={(e) => onChange(links.map((l, n) => (n === i ? { ...l, url: e.target.value } : l)))}
          />
          <Button variant="ghost" size="sm" onClick={() => onChange(links.filter((_, n) => n !== i))} aria-label={`Remove link ${i + 1}`}>
            <X aria-hidden="true" />
          </Button>
        </div>
      ))}
      {links.length < 6 && (
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => onChange([...links, { label: '', url: '' }])}>
          <Plus aria-hidden="true" /> Add a link
        </Button>
      )}
    </div>
  )
}

function DraftFields({ d, setD }: { d: Draft; setD: (d: Draft) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Name" htmlFor={`name`}>
          <Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </Field>
        <Field label="Kind" htmlFor={`cat`}>
          <Select value={d.category} onValueChange={(v) => setD({ ...d, category: v as PlaceCategory })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="artificial">Artificial course</SelectItem>
              <SelectItem value="natural">Natural river</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Description" htmlFor="desc">
        <Textarea rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </Field>
      <LinksField links={d.links} onChange={(links) => setD({ ...d, links })} />
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <Checkbox checked={d.isPublished} onCheckedChange={(v) => setD({ ...d, isPublished: !!v })} />
        Shown on the site
      </label>
    </div>
  )
}

function PlaceCard({
  place,
  canUp,
  canDown,
  busy,
  onMove,
}: {
  place: PaddlePlace
  canUp: boolean
  canDown: boolean
  busy: boolean
  onMove: (dir: 'up' | 'down') => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [d, setD] = useState<Draft>({
    name: place.name,
    category: place.category,
    description: place.description,
    links: place.links,
    isPublished: place.isPublished,
  })
  const disabled = pending || busy || uploading
  const photoUrl = siteImageUrl(place.photoPath)

  const save = () =>
    startTransition(async () => {
      const result = await savePlaceAction({ id: place.id, ...d })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        router.refresh()
      } else toast.error(result.message)
    })

  const remove = () =>
    startTransition(async () => {
      const result = await deletePlaceAction(place.id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
        router.refresh()
      } else toast.error(result.message)
    })

  const onPhoto = async (file: File) => {
    setUploading(true)
    try {
      const path = await uploadToBucket(SITE_IMAGES_BUCKET, placePhotoPath(place.id, file.name), file)
      const result = await setPlacePhotoAction({ id: place.id, photoPath: path })
      if (!result.ok) {
        await removeFromBucket(SITE_IMAGES_BUCKET, path).catch(() => {})
        toast.error(result.message)
      } else {
        toast.success('Photo saved')
        router.refresh()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearPhoto = () =>
    startTransition(async () => {
      const result = await setPlacePhotoAction({ id: place.id, photoPath: null })
      if (result.ok) {
        toast.success('Photo removed')
        router.refresh()
      } else toast.error(result.message)
    })

  return (
    <li className="rounded-xl border border-stone bg-card p-4">
      <div className="mb-2 flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" disabled={!canUp || disabled} onClick={() => onMove('up')} aria-label="Move up">
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" disabled={!canDown || disabled} onClick={() => onMove('down')} aria-label="Move down">
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={remove} aria-label="Remove place">
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div className="grid gap-2">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-stone bg-foam sm:aspect-square">
            {photoUrl ? (
              <Image src={photoUrl} alt={place.name} fill sizes="128px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-micro text-ink-muted">No photo</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPhoto(f)
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" disabled={disabled} onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden="true" /> {uploading ? 'Uploading…' : photoUrl ? 'Change' : 'Photo'}
            </Button>
            {photoUrl && (
              <Button variant="ghost" size="sm" disabled={disabled} onClick={clearPhoto} aria-label="Remove photo">
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <DraftFields d={d} setD={setD} />
          <div className="flex justify-end">
            <Button disabled={disabled} onClick={save}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}

export function PlacesEditor({ initial }: { initial: PaddlePlace[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState<Draft>({
    name: '',
    category: 'artificial',
    description: '',
    links: [],
    isPublished: true,
  })

  const move = (index: number, dir: 'up' | 'down') =>
    startTransition(async () => {
      const ids = initial.map((p) => p.id)
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= ids.length) return
      ;[ids[index], ids[target]] = [ids[target], ids[index]]
      const result = await reorderPlacesAction(ids)
      if (result.ok) router.refresh()
      else toast.error(result.message)
    })

  const add = () =>
    startTransition(async () => {
      const result = await savePlaceAction(adding)
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        setAdding({ name: '', category: 'artificial', description: '', links: [], isPublished: true })
        router.refresh()
      } else toast.error(result.message)
    })

  return (
    <div className="grid gap-4">
      {initial.length > 0 && (
        <ul className="grid gap-3">
          {initial.map((place, i) => (
            <PlaceCard
              key={place.id}
              place={place}
              canUp={i > 0}
              canDown={i < initial.length - 1}
              busy={pending}
              onMove={(dir) => move(i, dir)}
            />
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-dashed border-stone bg-foam/40 p-4">
        <h2 className="flex items-center gap-2 text-lg">
          <Plus aria-hidden="true" className="size-5 text-river" /> Add a place
        </h2>
        <p className="mt-1 text-micro text-ink-muted">
          Save it first, then a photo button appears on its card.
        </p>
        <div className="mt-3">
          <DraftFields d={adding} setD={setAdding} />
          <div className="mt-3 flex justify-end">
            <Button variant="signal" disabled={pending || adding.name.trim().length < 2} onClick={add}>
              Add {adding.name.trim() ? `"${adding.name.trim()}"` : 'place'} ({categoryLabel[adding.category].toLowerCase()})
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
