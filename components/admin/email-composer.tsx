'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Heading as HeadingIcon,
  List,
  Pilcrow,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  previewCampaignAction,
  saveCampaignAction,
  sendCampaignAction,
  sendTestEmailAction,
} from '@/lib/actions/email'
import {
  blockTypeLabels,
  type MinuteBlock,
  type MinuteBlockType,
} from '@/lib/minutes/blocks'
import {
  emailSegments,
  segmentHints,
  segmentLabels,
  type EmailSegment,
} from '@/lib/email/segments'
import { cn } from '@/lib/utils'
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
import { Textarea } from '@/components/ui/textarea'

/**
 * Writing an email to the members. The same block model as everything else the
 * club writes, so what is typed is data and the message that goes out is plain
 * text nobody can inject markup into.
 *
 * Sending is deliberately two-handed: you preview the actual text, you can
 * send yourself a copy, and only then is the send button meaningful, because
 * a mistake here goes to everybody at once and cannot be recalled.
 */

const typeIcons: Record<MinuteBlockType, React.ComponentType<{ className?: string }>> = {
  heading: HeadingIcon,
  paragraph: Pilcrow,
  bullets: List,
}

export function EmailComposer({
  campaignId,
  initial,
  counts,
  readOnly,
}: {
  campaignId?: string
  initial?: { subject: string; body: MinuteBlock[]; segment: EmailSegment | null }
  counts: Record<EmailSegment, number>
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [segment, setSegment] = useState<EmailSegment>(initial?.segment ?? 'paid_members')
  const [blocks, setBlocks] = useState<MinuteBlock[]>(
    initial?.body?.length ? initial.body : [{ type: 'paragraph', text: '' }]
  )
  const [preview, setPreview] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const update = (i: number, patch: Partial<MinuteBlock>) =>
    setBlocks((prev) => prev.map((b, n) => (n === i ? { ...b, ...patch } : b)))

  const move = (i: number, delta: number) =>
    setBlocks((prev) => {
      const next = [...prev]
      const target = i + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })

  const payload = () => ({ id: campaignId, subject, body: blocks, segment })

  const save = () =>
    startTransition(async () => {
      const result = await saveCampaignAction(payload())
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(result.message ?? 'Saved')
      if (!campaignId && result.id) router.push(`/admin/email/${result.id}`)
      else router.refresh()
    })

  const showPreview = () =>
    startTransition(async () => {
      const result = await previewCampaignAction(payload())
      if (result.ok) setPreview(result.text)
      else toast.error(result.message)
    })

  const sendTest = () =>
    startTransition(async () => {
      const result = await sendTestEmailAction(payload())
      if (result.ok) toast.success(result.message ?? 'Sent')
      else toast.error(result.message)
    })

  const send = () =>
    startTransition(async () => {
      if (!campaignId) return
      const result = await sendCampaignAction(campaignId)
      setConfirming(false)
      if (result.ok) {
        toast.success(result.message ?? 'Sending')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  if (readOnly) {
    return (
      <div className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">{subject}</h2>
        <div className="mt-3 grid gap-3 text-sm text-ink-muted">
          {blocks.map((b, i) => (
            <p key={i} className="whitespace-pre-line">
              {b.type === 'heading' ? <strong className="text-ink">{b.text}</strong> : b.text}
            </p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="grid gap-4 lg:col-span-8">
        <section className="rounded-xl border border-stone bg-card p-5">
          <Field label="Subject" htmlFor="em-subject">
            <Input
              id="em-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. The gate code has changed"
            />
          </Field>
        </section>

        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">The message</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Everyone gets it addressed to them by first name, and every copy carries an
            unsubscribe link automatically.
          </p>
          <ul className="mt-4 grid gap-3">
            {blocks.map((block, i) => {
              const Icon = typeIcons[block.type]
              return (
                <li key={i} className="rounded-lg border border-stone bg-foam/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={block.type}
                      onValueChange={(v) => update(i, { type: v as MinuteBlockType })}
                    >
                      <SelectTrigger className="w-[170px]" aria-label={`Part ${i + 1} type`}>
                        <span className="flex items-center gap-2">
                          <Icon aria-hidden="true" className="size-4" />
                          <SelectValue />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(blockTypeLabels) as MinuteBlockType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {blockTypeLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="ml-auto flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move part ${i + 1} up`}>
                        <ArrowUp aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} aria-label={`Move part ${i + 1} down`}>
                        <ArrowDown aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setBlocks((p) => p.filter((_, n) => n !== i))} aria-label={`Remove part ${i + 1}`}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    {block.type === 'heading' ? (
                      <Input
                        value={block.text}
                        onChange={(e) => update(i, { text: e.target.value })}
                        aria-label={`Heading ${i + 1}`}
                        className="font-heading text-lg font-semibold"
                      />
                    ) : (
                      <Textarea
                        rows={4}
                        value={block.text}
                        onChange={(e) => update(i, { text: e.target.value })}
                        aria-label={`${blockTypeLabels[block.type]} ${i + 1}`}
                        placeholder={block.type === 'bullets' ? 'One point per line' : 'What do you want to tell them?'}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['heading', 'paragraph', 'bullets'] as MinuteBlockType[]).map((t) => (
              <Button key={t} variant="outline" size="sm" onClick={() => setBlocks((p) => [...p, { type: t, text: '' }])}>
                <Plus aria-hidden="true" /> {blockTypeLabels[t]}
              </Button>
            ))}
          </div>
        </section>

        {preview !== null && (
          <section className="rounded-xl border border-river bg-card p-5">
            <p className="text-micro font-medium text-river">
              Exactly what lands in an inbox, unsubscribe line and all
            </p>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-foam p-3 font-sans text-sm whitespace-pre-wrap text-ink-muted">
              {preview}
            </pre>
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:col-span-4">
        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg">
            <Users aria-hidden="true" className="size-5 text-river" />
            Who gets it
          </h2>
          <div className="mt-3 grid gap-2">
            {emailSegments.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={segment === key}
                onClick={() => setSegment(key)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  segment === key ? 'border-river bg-foam' : 'border-stone hover:border-river'
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{segmentLabels[key]}</span>
                  <span className="font-heading font-semibold tabular-nums">{counts[key]}</span>
                </span>
                <span className="mt-0.5 block text-micro text-ink-muted">{segmentHints[key]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-micro text-ink-muted">
            Anybody who has turned club news off is already left out of these numbers. Booking and
            membership emails are separate and always reach them.
          </p>
        </section>

        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Send</h2>
          <div className="mt-3 grid gap-2">
            <Button variant="outline" disabled={pending} onClick={showPreview}>
              Preview it
            </Button>
            <Button variant="outline" disabled={pending || !subject.trim()} onClick={sendTest}>
              Send me a copy
            </Button>
            <Button variant="outline" disabled={pending || !subject.trim()} onClick={save}>
              Save the draft
            </Button>
            <Button
              variant="signal"
              disabled={pending || !campaignId || !subject.trim()}
              onClick={() => setConfirming(true)}
            >
              <Send aria-hidden="true" /> Send to {counts[segment]}{' '}
              {counts[segment] === 1 ? 'person' : 'people'}
            </Button>
            {!campaignId && (
              <p className="text-micro text-ink-muted">Save the draft first, then you can send it.</p>
            )}
          </div>
        </section>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this to {counts[segment]} people?</DialogTitle>
            <DialogDescription>
              This goes out straight away and cannot be called back. The group is{' '}
              {segmentLabels[segment].toLowerCase()}, and the subject is &ldquo;{subject}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Not yet
            </Button>
            <Button variant="signal" disabled={pending} onClick={send}>
              {pending ? 'Sending…' : 'Send it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
