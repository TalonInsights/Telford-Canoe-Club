'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Heading as HeadingIcon,
  List,
  Pilcrow,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  discardDraftAction,
  publishContentAction,
  saveDraftAction,
} from '@/lib/actions/content'
import {
  blockTypeHints,
  blockTypeLabels,
  type MinuteBlock,
  type MinuteBlockType,
} from '@/lib/minutes/blocks'
import { BlocksView } from '@/components/site/blocks-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
 * Editing one of the club's own passages. Two versions exist: what the site
 * shows, and what you are working on. Nothing you type here changes the site
 * until you press publish, and the preview shows exactly what visitors will
 * see because it renders through the same component the page uses.
 */

const typeIcons: Record<MinuteBlockType, React.ComponentType<{ className?: string }>> = {
  heading: HeadingIcon,
  paragraph: Pilcrow,
  bullets: List,
}

export function ContentEditor({
  contentKey,
  title,
  location,
  help,
  published,
  draft,
}: {
  contentKey: string
  title: string
  location: string
  help: string | null
  published: MinuteBlock[]
  draft: MinuteBlock[] | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [blocks, setBlocks] = useState<MinuteBlock[]>(draft ?? published)
  const [preview, setPreview] = useState(false)
  const hasDraft = draft !== null

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

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await fn()
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="grid gap-4 lg:col-span-8">
        <section className="rounded-xl border border-stone bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg">{title}</h2>
            {hasDraft && <Badge variant="warn">Unpublished draft</Badge>}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{location}</p>
          {help && <p className="mt-1 text-micro text-ink-muted">{help}</p>}
        </section>

        {preview ? (
          <section className="rounded-xl border border-river bg-card p-6">
            <p className="mb-4 text-micro font-medium text-river">
              Preview, exactly as a visitor would see it
            </p>
            <BlocksView
              body={blocks}
              empty={
                <p className="text-ink-muted">
                  Nothing here yet. With this empty, the section does not appear on the site at
                  all.
                </p>
              }
            />
          </section>
        ) : (
          <section className="rounded-xl border border-stone bg-card p-5">
            <ul className="grid gap-3">
              {blocks.map((block, i) => {
                const Icon = typeIcons[block.type]
                return (
                  <li key={i} className="rounded-lg border border-stone bg-foam/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={block.type}
                        onValueChange={(v) => update(i, { type: v as MinuteBlockType })}
                      >
                        <SelectTrigger className="w-[170px]" aria-label={`Block ${i + 1} type`}>
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
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                          aria-label={`Move block ${i + 1} up`}
                        >
                          <ArrowUp aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={i === blocks.length - 1}
                          onClick={() => move(i, 1)}
                          aria-label={`Move block ${i + 1} down`}
                        >
                          <ArrowDown aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBlocks((prev) => prev.filter((_, n) => n !== i))}
                          aria-label={`Remove block ${i + 1}`}
                        >
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
                          placeholder="Section heading"
                        />
                      ) : (
                        <Textarea
                          rows={block.type === 'bullets' ? 4 : 4}
                          value={block.text}
                          onChange={(e) => update(i, { text: e.target.value })}
                          aria-label={`${blockTypeLabels[block.type]} ${i + 1}`}
                          placeholder={
                            block.type === 'bullets' ? 'One point per line' : 'Write the text here'
                          }
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {(['heading', 'paragraph', 'bullets'] as MinuteBlockType[]).map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => setBlocks((prev) => [...prev, { type: t, text: '' }])}
                >
                  <Plus aria-hidden="true" /> {blockTypeLabels[t]}
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:col-span-4">
        <section className="rounded-xl border border-stone bg-card p-5">
          <h2 className="text-lg">Publishing</h2>
          <div className="mt-4 grid gap-2">
            <Button variant="outline" onClick={() => setPreview((p) => !p)}>
              <Eye aria-hidden="true" /> {preview ? 'Back to editing' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => saveDraftAction({ key: contentKey, body: blocks }))}
            >
              Save as a draft
            </Button>
            <Button
              disabled={pending}
              onClick={() => run(() => publishContentAction({ key: contentKey, body: blocks }))}
            >
              {pending ? 'Publishing…' : 'Publish to the site'}
            </Button>
            {hasDraft && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const result = await discardDraftAction(contentKey)
                    if (result.ok) setBlocks(published)
                    return result
                  })
                }
              >
                Throw the draft away
              </Button>
            )}
          </div>
          <p className="mt-3 text-micro text-ink-muted">
            A draft is yours alone until you publish. Publishing replaces what visitors see
            straight away.
          </p>
        </section>
      </div>
    </div>
  )
}
