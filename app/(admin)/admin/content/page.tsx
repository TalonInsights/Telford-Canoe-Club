import type { Metadata } from 'next'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth/guards'
import { minutesPreview } from '@/lib/minutes/blocks'
import { getEditableBlocks } from '@/lib/queries/content'

export const metadata: Metadata = { title: 'Page words' }

export default async function AdminContentPage() {
  const [, blocks] = await Promise.all([requireRole('committee'), getEditableBlocks()])

  return (
    <>
      <div>
        <h1 className="text-2xl">Page words</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          Passages on the public site the club can rewrite without a developer. Each one has a
          draft you can work on and preview before anybody else sees it.
        </p>
      </div>

      <ul className="mt-6 grid gap-3">
        {blocks.map((block) => (
          <li key={block.key}>
            <Link
              href={`/admin/content/${encodeURIComponent(block.key)}`}
              className="block rounded-xl border border-stone bg-card p-4 transition-colors hover:border-river"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{block.title}</span>
                {block.draft !== null && <Badge variant="warn">Unpublished draft</Badge>}
                {block.body.length === 0 && <Badge variant="outline">Empty, not shown</Badge>}
                <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <Pencil aria-hidden="true" className="size-3.5" />
                  Edit
                </span>
              </div>
              <p className="mt-1 text-micro text-ink-muted">{block.location}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {minutesPreview(block.draft ?? block.body) || 'Nothing written yet'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
