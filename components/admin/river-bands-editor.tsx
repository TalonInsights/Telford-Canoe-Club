'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CircleAlert, Pencil, Plus, Trash2, Waves } from 'lucide-react'
import { toast } from 'sonner'

import { deleteRiverBandAction, saveRiverBandAction } from '@/lib/actions/river-bands'
import {
  bandRangeLabel,
  checkBands,
  matchBand,
  metresToCm,
  type RiverBand,
} from '@/lib/river/bands'
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
import { Textarea } from '@/components/ui/textarea'

/**
 * The ladder that turns a gauge reading into plain English. Levels are in
 * centimetres, and either end can be left empty so "under 50" and "over 200"
 * are expressible. Overlaps and gaps are shown as warnings, not refusals.
 */

type Draft = {
  id?: string
  minCm: string
  maxCm: string
  label: string
  description: string
  sortOrder: number
}

const toDraft = (band: RiverBand): Draft => ({
  id: band.id,
  minCm: band.minCm === null ? '' : String(band.minCm),
  maxCm: band.maxCm === null ? '' : String(band.maxCm),
  label: band.label,
  description: band.description ?? '',
  sortOrder: band.sortOrder,
})

const emptyDraft = (nextOrder: number): Draft => ({
  minCm: '',
  maxCm: '',
  label: '',
  description: '',
  sortOrder: nextOrder,
})

const digits = (value: string) => value.replace(/[^\d]/g, '')

export function RiverBandsEditor({
  bands,
  currentMetres,
}: {
  bands: RiverBand[]
  currentMetres: number | null
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()

  const problems = checkBands(bands)
  const currentCm = currentMetres === null ? null : metresToCm(currentMetres)
  const currentBand = currentCm === null ? null : matchBand(bands, currentCm)

  const save = () =>
    startTransition(async () => {
      if (!draft) return
      const result = await saveRiverBandAction({
        id: draft.id,
        minCm: draft.minCm === '' ? null : Number(draft.minCm),
        maxCm: draft.maxCm === '' ? null : Number(draft.maxCm),
        label: draft.label,
        description: draft.description || null,
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

  const remove = (band: RiverBand) =>
    startTransition(async () => {
      const result = await deleteRiverBandAction(band.id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-stone bg-card p-4">
        <p className="flex items-center gap-2 text-micro font-medium text-ink-muted">
          <Waves aria-hidden="true" className="size-3.5" />
          The gauge right now
        </p>
        {currentMetres === null || currentCm === null ? (
          <p className="mt-1 text-sm text-ink-muted">
            The Environment Agency gauge is not answering at the moment, so there is nothing to
            match. Your bands are still saved.
          </p>
        ) : (
          <p className="mt-1">
            <span className="font-heading text-2xl font-semibold tabular-nums">{currentCm} cm</span>{' '}
            <span className="text-sm text-ink-muted">({currentMetres.toFixed(2)} m at Buildwas)</span>
            {currentBand ? (
              <span className="ml-2 font-medium text-river">reads as &ldquo;{currentBand.label}&rdquo;</span>
            ) : (
              <span className="ml-2 font-medium text-warn">falls outside every band</span>
            )}
          </p>
        )}
      </div>

      {problems.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-card p-4" role="status">
          <p className="flex items-center gap-2 font-medium text-warn">
            <CircleAlert aria-hidden="true" className="size-4" />
            Worth a look
          </p>
          <ul className="mt-2 grid gap-1 text-sm text-ink-muted">
            {problems.map((problem, i) => (
              <li key={i}>{problem.message}</li>
            ))}
          </ul>
          <p className="mt-2 text-micro text-ink-muted">
            These are warnings, not errors. Save what you meant to save.
          </p>
        </div>
      )}

      <ul className="grid gap-2">
        {bands.map((band) => (
          <li
            key={band.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-stone bg-card p-4"
          >
            <span className="w-32 shrink-0 font-medium tabular-nums">{bandRangeLabel(band)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold">{band.label}</p>
              {band.description && (
                <p className="mt-0.5 text-micro text-ink-muted">{band.description}</p>
              )}
            </div>
            {currentBand?.id === band.id && (
              <span className="rounded-full bg-river px-2 py-0.5 text-micro font-medium text-white">
                Now
              </span>
            )}
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(band))}>
                <Pencil aria-hidden="true" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(band)}
                aria-label={`Remove ${band.label}`}
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
          onClick={() => setDraft(emptyDraft((bands.at(-1)?.sortOrder ?? 0) + 1))}
        >
          <Plus aria-hidden="true" /> Add a band
        </Button>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? `Edit ${draft.label || 'band'}` : 'Add a band'}</DialogTitle>
            <DialogDescription>
              Levels are in centimetres, matching how the club talks about the rapid. Leave
              &ldquo;from&rdquo; empty for the lowest band and &ldquo;to&rdquo; empty for the
              highest, so every reading lands somewhere.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="From (cm)" htmlFor="band-min" optional helper="Empty means no lower limit.">
                  <Input
                    id="band-min"
                    inputMode="numeric"
                    value={draft.minCm}
                    onChange={(e) => setDraft({ ...draft, minCm: digits(e.target.value) })}
                    placeholder="50"
                  />
                </Field>
                <Field label="To (cm)" htmlFor="band-max" optional helper="Empty means no upper limit.">
                  <Input
                    id="band-max"
                    inputMode="numeric"
                    value={draft.maxCm}
                    onChange={(e) => setDraft({ ...draft, maxCm: digits(e.target.value) })}
                    placeholder="100"
                  />
                </Field>
              </div>

              <Field label="What to call it" htmlFor="band-label">
                <Input
                  id="band-label"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="Surfs up"
                />
              </Field>

              <Field label="What it means" htmlFor="band-desc" optional>
                <Textarea
                  id="band-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="The wave is working. The usual playing level at Jackfield."
                />
              </Field>

              <Field label="Order" htmlFor="band-order" helper="Lowest number shows first.">
                <Input
                  id="band-order"
                  inputMode="numeric"
                  value={String(draft.sortOrder)}
                  onChange={(e) =>
                    setDraft({ ...draft, sortOrder: Number(digits(e.target.value)) || 0 })
                  }
                />
              </Field>
            </div>
          )}

          <DialogFooter>
            <Button disabled={pending || !draft?.label.trim()} onClick={save}>
              {pending ? 'Saving…' : 'Save band'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
