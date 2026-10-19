'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteFaqAction, reorderFaqsAction, saveFaqAction } from '@/lib/actions/faqs'
import type { Faq } from '@/lib/queries/faqs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * The committee's FAQ screen: edit a question in place, add one, remove one,
 * reorder with the arrows. The order is saved as a whole list so it can never
 * end up half-swapped.
 */

type Draft = { question: string; answer: string; isPublished: boolean }

function FaqCard({
  faq,
  canUp,
  canDown,
  busy,
  onMove,
}: {
  faq: Faq
  canUp: boolean
  canDown: boolean
  busy: boolean
  onMove: (dir: 'up' | 'down') => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [d, setD] = useState<Draft>({ question: faq.question, answer: faq.answer, isPublished: faq.isPublished })
  const disabled = pending || busy

  const save = () =>
    startTransition(async () => {
      const result = await saveFaqAction({ id: faq.id, ...d })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        router.refresh()
      } else toast.error(result.message)
    })

  const remove = () =>
    startTransition(async () => {
      const result = await deleteFaqAction(faq.id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
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
        <Button variant="ghost" size="sm" disabled={disabled} onClick={remove} aria-label="Remove question">
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-3">
        <Field label="Question" htmlFor={`q-${faq.id}`}>
          <Input id={`q-${faq.id}`} value={d.question} onChange={(e) => setD({ ...d, question: e.target.value })} />
        </Field>
        <Field label="Answer" htmlFor={`a-${faq.id}`}>
          <Textarea id={`a-${faq.id}`} rows={4} value={d.answer} onChange={(e) => setD({ ...d, answer: e.target.value })} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-2.5 text-sm">
            <Checkbox checked={d.isPublished} onCheckedChange={(v) => setD({ ...d, isPublished: !!v })} />
            Shown on the site
          </label>
          <Button disabled={disabled} onClick={save}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function FaqEditor({ initial }: { initial: Faq[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState<Draft>({ question: '', answer: '', isPublished: true })

  const move = (index: number, dir: 'up' | 'down') =>
    startTransition(async () => {
      const ids = initial.map((f) => f.id)
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= ids.length) return
      ;[ids[index], ids[target]] = [ids[target], ids[index]]
      const result = await reorderFaqsAction(ids)
      if (result.ok) router.refresh()
      else toast.error(result.message)
    })

  const add = () =>
    startTransition(async () => {
      const result = await saveFaqAction(adding)
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        setAdding({ question: '', answer: '', isPublished: true })
        router.refresh()
      } else toast.error(result.message)
    })

  return (
    <div className="grid gap-4">
      {initial.length > 0 && (
        <ul className="grid gap-3">
          {initial.map((faq, i) => (
            <FaqCard
              key={faq.id}
              faq={faq}
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
          <Plus aria-hidden="true" className="size-5 text-river" /> Add a question
        </h2>
        <div className="mt-3 grid gap-3">
          <Field label="Question" htmlFor="faq-new-q">
            <Input
              id="faq-new-q"
              value={adding.question}
              onChange={(e) => setAdding({ ...adding, question: e.target.value })}
              placeholder="e.g. Is there parking at the site?"
            />
          </Field>
          <Field label="Answer" htmlFor="faq-new-a">
            <Textarea
              id="faq-new-a"
              rows={4}
              value={adding.answer}
              onChange={(e) => setAdding({ ...adding, answer: e.target.value })}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-11 items-center gap-2.5 text-sm">
              <Checkbox checked={adding.isPublished} onCheckedChange={(v) => setAdding({ ...adding, isPublished: !!v })} />
              Show it straight away
            </label>
            <Button variant="signal" disabled={pending || !adding.question.trim() || !adding.answer.trim()} onClick={add}>
              Add question
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
