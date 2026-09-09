'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import {
  deleteMembershipTypeAction,
  saveMembershipTypeAction,
} from '@/lib/actions/membership-types'
import { formatMoneyGBP } from '@/lib/format'
import type { MembershipType } from '@/lib/queries/membership-types'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

/**
 * What the club sells, edited by the club. Adding a "Half year" here puts it
 * on the join page immediately, with no deploy.
 *
 * Two fields carry the weight. Duration decides when a membership actually
 * runs out: left empty it behaves as every membership has until now and runs
 * to the end of the club's year, filled in it lasts that many months from the
 * day it is paid for. "On sale" only affects new sign-ups, never anybody
 * already holding one.
 */

type Draft = {
  id?: string
  slug: string
  name: string
  description: string
  pricePounds: string
  durationMonths: string
  coversFamily: boolean
  legacyTier: 'adult' | 'junior' | 'family'
  isActive: boolean
  sortOrder: number
}

const toDraft = (t: MembershipType): Draft => ({
  id: t.id,
  slug: t.slug,
  name: t.name,
  description: t.description ?? '',
  pricePounds: (t.pricePence / 100).toFixed(2),
  durationMonths: t.durationMonths === null ? '' : String(t.durationMonths),
  coversFamily: t.coversFamily,
  legacyTier: t.legacyTier,
  isActive: t.isActive,
  sortOrder: t.sortOrder,
})

const emptyDraft = (nextOrder: number): Draft => ({
  slug: '',
  name: '',
  description: '',
  pricePounds: '',
  durationMonths: '',
  coversFamily: false,
  legacyTier: 'adult',
  isActive: true,
  sortOrder: nextOrder,
})

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

export function MembershipTypesEditor({ types }: { types: MembershipType[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      if (!draft) return
      const pounds = Number(draft.pricePounds)
      if (!Number.isFinite(pounds) || pounds < 0) {
        toast.error('Give it a price in pounds')
        return
      }
      const result = await saveMembershipTypeAction({
        id: draft.id,
        slug: draft.slug || slugify(draft.name),
        name: draft.name,
        description: draft.description || null,
        pricePence: Math.round(pounds * 100),
        durationMonths: draft.durationMonths === '' ? null : Number(draft.durationMonths),
        coversFamily: draft.coversFamily,
        legacyTier: draft.legacyTier,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        setDraft(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = (type: MembershipType) =>
    startTransition(async () => {
      const result = await deleteMembershipTypeAction(type.id)
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
        {types.map((type) => (
          <li
            key={type.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-stone bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{type.name}</span>
                <span className="font-heading font-semibold tabular-nums">
                  {formatMoneyGBP(type.pricePence)}
                </span>
                {!type.isActive && <Badge variant="warn">Not on sale</Badge>}
                {type.coversFamily && (
                  <span className="inline-flex items-center gap-1 text-micro text-ink-muted">
                    <Users aria-hidden="true" className="size-3.5" />
                    Covers a household
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-micro text-ink-muted">
                {type.durationMonths === null
                  ? 'Runs to the end of the membership year'
                  : `${type.durationMonths} months from the day it is paid`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(type))}>
                <Pencil aria-hidden="true" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(type)}
                aria-label={`Remove ${type.name}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Button
          variant="secondary"
          onClick={() => setDraft(emptyDraft((types.at(-1)?.sortOrder ?? 0) + 1))}
        >
          <Plus aria-hidden="true" /> Add a membership
        </Button>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? `Edit ${draft.name || 'membership'}` : 'Add a membership'}
            </DialogTitle>
            <DialogDescription>
              This appears on the join page as soon as you save it. Changing a price or a name
              never affects anybody who has already bought one.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1">
              <Field label="Name" htmlFor="mt-name">
                <Input
                  id="mt-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      slug: draft.id ? draft.slug : slugify(e.target.value),
                    })
                  }
                  placeholder="Half year"
                />
              </Field>

              <Field label="Description" htmlFor="mt-desc" optional helper="One line, shown under the price.">
                <Textarea
                  id="mt-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Six months from the day you pay, for anyone joining mid-season."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price in pounds" htmlFor="mt-price">
                  <Input
                    id="mt-price"
                    inputMode="decimal"
                    value={draft.pricePounds}
                    onChange={(e) => setDraft({ ...draft, pricePounds: e.target.value })}
                    placeholder="15.00"
                  />
                </Field>
                <Field
                  label="Lasts (months)"
                  htmlFor="mt-duration"
                  optional
                  helper="Empty means it runs to the end of the membership year, as the annual ones do."
                >
                  <Input
                    id="mt-duration"
                    inputMode="numeric"
                    value={draft.durationMonths}
                    onChange={(e) =>
                      setDraft({ ...draft, durationMonths: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="6"
                  />
                </Field>
              </div>

              <Field
                label="Counts as"
                htmlFor="mt-tier"
                helper="Which of the club's three original categories this belongs to, for old reports and filters."
              >
                <Select
                  value={draft.legacyTier}
                  onValueChange={(v) => setDraft({ ...draft, legacyTier: v as Draft['legacyTier'] })}
                >
                  <SelectTrigger id="mt-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-stone p-3">
                <div>
                  <p className="text-sm font-medium">Covers a household</p>
                  <p className="text-micro text-ink-muted">
                    Asks for the names of everyone else it covers when somebody buys it.
                  </p>
                </div>
                <Switch
                  checked={draft.coversFamily}
                  onCheckedChange={(v) => setDraft({ ...draft, coversFamily: v })}
                  aria-label="Covers a household"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-stone p-3">
                <div>
                  <p className="text-sm font-medium">On sale</p>
                  <p className="text-micro text-ink-muted">
                    Off hides it from new sign-ups. Anybody already on it keeps it.
                  </p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                  aria-label="On sale"
                />
              </div>

              <Field label="Order" htmlFor="mt-order" helper="Lowest number shows first on the join page.">
                <Input
                  id="mt-order"
                  inputMode="numeric"
                  value={String(draft.sortOrder)}
                  onChange={(e) =>
                    setDraft({ ...draft, sortOrder: Number(e.target.value.replace(/\D/g, '')) || 0 })
                  }
                />
              </Field>
            </div>
          )}

          <DialogFooter>
            <Button disabled={pending || !draft?.name.trim()} onClick={save}>
              {pending ? 'Saving…' : 'Save membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
