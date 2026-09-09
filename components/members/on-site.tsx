'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CalendarPlus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { postCheckinAction, removeCheckinAction } from '@/lib/actions/checkins'
import type { Checkin } from '@/lib/queries/checkins'
import { formatDateShort, formatTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * Saying you will be on site, and seeing who else will be.
 *
 * Deliberately plain: a date, a start, a finish, and an optional line about
 * what you are doing. Posting is the consent, removing is one tap, and no
 * message is sent to anybody when you post.
 */

function defaultDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString()
}

function whenLabel(checkin: Checkin): string {
  return `${formatDateShort(checkin.startsAt)}, ${formatTime(checkin.startsAt)} to ${formatTime(checkin.endsAt)}`
}

export function OnSiteBoard({ checkins }: { checkins: Checkin[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(defaultDate)
  const [from, setFrom] = useState('17:30')
  const [to, setTo] = useState('20:00')
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const mine = checkins.filter((c) => c.isMine)

  const post = () =>
    startTransition(async () => {
      const result = await postCheckinAction({
        startsAt: toIso(date, from),
        endsAt: toIso(date, to),
        note: note || undefined,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        setOpen(false)
        setNote('')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = (id: string) =>
    startTransition(async () => {
      const result = await removeCheckinAction(id)
      if (result.ok) {
        toast.success(result.message ?? 'Removed')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setOpen(true)}>
          <CalendarPlus aria-hidden="true" /> I&apos;m going to be on site
        </Button>
        {mine.length > 0 && (
          <p className="text-sm text-ink-muted">
            You have {mine.length === 1 ? 'one session' : `${mine.length} sessions`} up there.
          </p>
        )}
      </div>

      {checkins.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nobody has said yet"
          description="Be the first. Put your name up and other members can decide to come down at the same time."
          action={<Button onClick={() => setOpen(true)}>I&apos;m going to be on site</Button>}
        />
      ) : (
        <ul className="grid gap-2">
          {checkins.map((checkin) => (
            <li
              key={checkin.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-stone bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {checkin.who}
                  {checkin.isMine && <span className="ml-2 text-micro text-river">you</span>}
                </p>
                <p className="text-sm text-ink-muted">{whenLabel(checkin)}</p>
                {checkin.note && <p className="mt-0.5 text-micro text-ink-muted">{checkin.note}</p>}
              </div>
              {checkin.isMine && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => remove(checkin.id)}
                  aria-label="Remove my session"
                >
                  <Trash2 aria-hidden="true" /> Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>When will you be there?</DialogTitle>
            <DialogDescription>
              Other current members will see your first name, your last initial and these times.
              Nobody is notified, and you can take it down whenever you like.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label="Day" htmlFor="ci-date">
              <Input
                id="ci-date"
                type="date"
                value={date}
                min={defaultDate()}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From" htmlFor="ci-from">
                <Input
                  id="ci-from"
                  type="time"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Until" htmlFor="ci-to">
                <Input id="ci-to" type="time" value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
            <Field
              label="Anything to add"
              htmlFor="ci-note"
              optional
              helper="Kept short, and visible to other members."
            >
              <Input
                id="ci-note"
                value={note}
                maxLength={140}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. playboating, happy to share a shuttle"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button disabled={pending} onClick={post}>
              {pending ? 'Putting you up…' : 'Put me up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
