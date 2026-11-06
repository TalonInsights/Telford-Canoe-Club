'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CalendarCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'

import {
  saveMembershipPeriodAction,
  setCurrentPeriodAction,
  type PeriodInput,
} from '@/lib/actions/membership-periods'
import type { MembershipPeriod } from '@/lib/queries/membership-periods'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * Setting the membership year (item 14). The club chooses when its year starts
 * and ends — a calendar year, or April to March, whatever it runs. One year is
 * the "current" one, which is what the join page sells and what renewals count
 * down to. Changing a year never alters a membership already bought: each one
 * fixed its own end date when it was paid for.
 */

type Draft = { label: string; startsOn: string; endsOn: string }

function RowEditor({
  period,
  onSaved,
}: {
  period: MembershipPeriod
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>({
    label: period.label,
    startsOn: period.startsOn,
    endsOn: period.endsOn,
  })
  const [pending, startTransition] = useTransition()
  const dirty =
    draft.label !== period.label ||
    draft.startsOn !== period.startsOn ||
    draft.endsOn !== period.endsOn

  const save = () =>
    startTransition(async () => {
      const result = await saveMembershipPeriodAction({ id: period.id, ...draft } as PeriodInput)
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        onSaved()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" htmlFor={`label-${period.id}`}>
          <Input
            id={`label-${period.id}`}
            value={draft.label}
            maxLength={20}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          />
        </Field>
        <Field label="Starts" htmlFor={`start-${period.id}`}>
          <Input
            id={`start-${period.id}`}
            type="date"
            value={draft.startsOn}
            onChange={(e) => setDraft((d) => ({ ...d, startsOn: e.target.value }))}
          />
        </Field>
        <Field label="Ends" htmlFor={`end-${period.id}`}>
          <Input
            id={`end-${period.id}`}
            type="date"
            value={draft.endsOn}
            onChange={(e) => setDraft((d) => ({ ...d, endsOn: e.target.value }))}
          />
        </Field>
      </div>
      <div className="flex items-end">
        <Button variant="outline" size="sm" disabled={pending || !dirty} onClick={save}>
          {pending ? 'Saving…' : 'Save dates'}
        </Button>
      </div>
    </div>
  )
}

export function MembershipYearEditor({ periods }: { periods: MembershipPeriod[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>({ label: '', startsOn: '', endsOn: '' })
  const [pending, startTransition] = useTransition()

  const refresh = () => router.refresh()

  const makeCurrent = (id: string) =>
    startTransition(async () => {
      const result = await setCurrentPeriodAction(id)
      if (result.ok) {
        toast.success(result.message ?? 'Updated')
        refresh()
      } else {
        toast.error(result.message)
      }
    })

  const add = () =>
    startTransition(async () => {
      const result = await saveMembershipPeriodAction(draft as PeriodInput)
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        setDraft({ label: '', startsOn: '', endsOn: '' })
        setAdding(false)
        refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {periods.map((p) => (
          <li key={p.id} className="rounded-xl border border-stone bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{p.label}</span>
              {p.isCurrent ? (
                <Badge variant="success">
                  <CalendarCheck aria-hidden="true" /> Current year
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => makeCurrent(p.id)}
                >
                  Make this the current year
                </Button>
              )}
              <span className="ml-auto text-sm text-ink-muted">
                {formatDate(p.startsOn)} – {formatDate(p.endsOn)}
              </span>
            </div>
            <div className="mt-3 border-t border-stone pt-3">
              <RowEditor period={p} onSaved={refresh} />
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="rounded-xl border border-river/40 bg-foam p-4">
          <h3 className="text-sm font-medium">Add a membership year</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Name" htmlFor="new-label" helper="e.g. 2027 or 2026/27">
              <Input
                id="new-label"
                value={draft.label}
                maxLength={20}
                placeholder="2027"
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </Field>
            <Field label="Starts" htmlFor="new-start">
              <Input
                id="new-start"
                type="date"
                value={draft.startsOn}
                onChange={(e) => setDraft((d) => ({ ...d, startsOn: e.target.value }))}
              />
            </Field>
            <Field label="Ends" htmlFor="new-end">
              <Input
                id="new-end"
                type="date"
                value={draft.endsOn}
                onChange={(e) => setDraft((d) => ({ ...d, endsOn: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="signal"
              size="sm"
              disabled={pending || !draft.label || !draft.startsOn || !draft.endsOn}
              onClick={add}
            >
              {pending ? 'Adding…' : 'Add year'}
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" /> Add a membership year
          </Button>
        </div>
      )}
    </div>
  )
}
