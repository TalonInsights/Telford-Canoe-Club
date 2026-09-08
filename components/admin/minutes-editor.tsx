'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Heading as HeadingIcon,
  List,
  Paperclip,
  Pilcrow,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { saveMinutesAction } from '@/lib/actions/minutes'
import {
  blockTypeHints,
  blockTypeLabels,
  minutesTemplate,
  type MinuteBlock,
  type MinuteBlockType,
} from '@/lib/minutes/blocks'
import { uploadToBucket } from '@/lib/storage/client-upload'
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_MB } from '@/lib/storage/documents'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { FileUpload } from '@/components/ui/file-upload'
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
 * The minutes template, as a form. Date and title at the top, then the body as
 * a list of blocks the committee fills in. A block is a heading, a paragraph
 * or a bullet list, and the box you type into changes to match: a heading is a
 * single large line, so what you are writing looks like what members will read.
 *
 * Nothing here produces HTML. The blocks are stored as data and rendered as
 * elements, which is what keeps a pasted-in fragment of markup harmless.
 */

function Card({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-stone bg-card p-5">
      <h2 className="text-lg">{title}</h2>
      {intro && <p className="mt-1 text-sm text-ink-muted">{intro}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

const typeIcons: Record<MinuteBlockType, React.ComponentType<{ className?: string }>> = {
  heading: HeadingIcon,
  paragraph: Pilcrow,
  bullets: List,
}

function BlockRow({
  block,
  index,
  total,
  onChange,
  onType,
  onMove,
  onRemove,
}: {
  block: MinuteBlock
  index: number
  total: number
  onChange: (text: string) => void
  onType: (type: MinuteBlockType) => void
  onMove: (delta: number) => void
  onRemove: () => void
}) {
  const Icon = typeIcons[block.type]
  const fieldId = `block-${index}`

  return (
    <li className="rounded-lg border border-stone bg-foam/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={block.type} onValueChange={(v) => onType(v as MinuteBlockType)}>
          <SelectTrigger className="w-[170px]" aria-label={`Block ${index + 1} type`}>
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
        <p className="text-micro text-ink-muted">{blockTypeHints[block.type]}</p>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={`Move block ${index + 1} up`}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={`Move block ${index + 1} down`}
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove block ${index + 1}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-2">
        {block.type === 'heading' ? (
          <Input
            id={fieldId}
            value={block.text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Section heading"
            aria-label={`Heading ${index + 1}`}
            className={cn('font-heading text-lg font-semibold')}
          />
        ) : (
          <Textarea
            id={fieldId}
            rows={block.type === 'bullets' ? 4 : 3}
            value={block.text}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${blockTypeLabels[block.type]} ${index + 1}`}
            placeholder={
              block.type === 'bullets'
                ? 'One point per line'
                : 'What was discussed, decided or agreed'
            }
          />
        )}
      </div>
    </li>
  )
}

export function MinutesEditor({
  minutesId,
  initial,
  mode,
}: {
  minutesId: string
  initial?: {
    meetingDate: string
    title: string
    body: MinuteBlock[]
    status: string
    attachmentPath: string | null
    attachmentName: string | null
  }
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [meetingDate, setMeetingDate] = useState(
    initial?.meetingDate ?? new Date().toISOString().slice(0, 10)
  )
  const [title, setTitle] = useState(initial?.title ?? 'Committee meeting')
  const [blocks, setBlocks] = useState<MinuteBlock[]>(
    initial?.body?.length ? initial.body : minutesTemplate()
  )
  const [attachment, setAttachment] = useState<{ path: string; name: string } | null>(
    initial?.attachmentPath
      ? { path: initial.attachmentPath, name: initial.attachmentName ?? 'Attached file' }
      : null
  )

  const update = (index: number, patch: Partial<MinuteBlock>) =>
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)))

  const move = (index: number, delta: number) =>
    setBlocks((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const add = (type: MinuteBlockType) =>
    setBlocks((prev) => [...prev, { type, text: '' }])

  const save = (publish?: boolean) =>
    startTransition(async () => {
      const result = await saveMinutesAction(
        {
          id: minutesId,
          meetingDate,
          title,
          body: blocks,
          attachmentPath: attachment?.path ?? null,
          attachmentName: attachment?.name ?? null,
        },
        publish === undefined ? undefined : { publish }
      )
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(result.message ?? 'Saved')
      if (mode === 'create') router.push(`/admin/minutes/${minutesId}`)
      else router.refresh()
    })

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="grid gap-4 lg:col-span-8">
        <Card title="The meeting" intro="What members see at the top of the page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of the meeting" htmlFor="min-date">
              <Input
                id="min-date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </Field>
            <Field label="Title" htmlFor="min-title">
              <Input
                id="min-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Committee meeting"
              />
            </Field>
          </div>
        </Card>

        <Card
          title="The minutes"
          intro="The club's usual running order is already here. Fill in what applies, delete what does not, and add sections as you need them."
        >
          <ul className="grid gap-3">
            {blocks.map((block, i) => (
              <BlockRow
                key={i}
                block={block}
                index={i}
                total={blocks.length}
                onChange={(text) => update(i, { text })}
                onType={(type) => update(i, { type })}
                onMove={(delta) => move(i, delta)}
                onRemove={() => setBlocks((prev) => prev.filter((_, n) => n !== i))}
              />
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => add('heading')}>
              <Plus aria-hidden="true" /> Heading
            </Button>
            <Button variant="outline" size="sm" onClick={() => add('paragraph')}>
              <Plus aria-hidden="true" /> Paragraph
            </Button>
            <Button variant="outline" size="sm" onClick={() => add('bullets')}>
              <Plus aria-hidden="true" /> Bullet list
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setBlocks(minutesTemplate())}
            >
              Start again from the template
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:col-span-4">
        <Card title="Save">
          {mode === 'create' ? (
            <div className="grid gap-2">
              <Button disabled={pending || !title.trim()} onClick={() => save(true)}>
                {pending ? 'Saving…' : 'Save and publish to members'}
              </Button>
              <Button
                variant="outline"
                disabled={pending || !title.trim()}
                onClick={() => save(false)}
              >
                Save as a draft
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              <Button disabled={pending || !title.trim()} onClick={() => save()}>
                {pending ? 'Saving…' : 'Save changes'}
              </Button>
              <p className="text-micro text-ink-muted">
                {initial?.status === 'published'
                  ? 'These minutes are published, so members see your changes as soon as you save.'
                  : 'These are still a draft. Publish them from the button above the editor when the committee is happy.'}
              </p>
            </div>
          )}
        </Card>

        <Card
          title="Signed copy"
          intro="Optional. Attach the signed original if the club keeps one; members see it as a download beneath the minutes."
        >
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-stone p-3">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <Paperclip aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
                <span className="truncate">{attachment.name}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachment(null)}
                aria-label="Remove the attached file"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <FileUpload
              accept={DOCUMENT_ACCEPT}
              maxSizeMb={DOCUMENT_MAX_MB}
              multiple={false}
              label="Attach the signed minutes"
              hint={`PDF or Word, up to ${DOCUMENT_MAX_MB}MB`}
              upload={async (file, onProgress) => {
                onProgress(20)
                const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80)
                const path = await uploadToBucket(
                  'documents-members',
                  `minutes/${minutesId}/${Date.now()}-${safe}`,
                  file,
                  { cacheControl: '0' }
                )
                onProgress(100)
                setAttachment({ path, name: file.name })
              }}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
