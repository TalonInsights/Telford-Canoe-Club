import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ContentEditor } from '@/components/admin/content-editor'
import { requireRole } from '@/lib/auth/guards'
import { getEditableBlock } from '@/lib/queries/content'

export const metadata: Metadata = { title: 'Edit words' }

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const [, { key }] = await Promise.all([requireRole('committee'), params])
  const block = await getEditableBlock(decodeURIComponent(key))
  if (!block) notFound()

  return (
    <>
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All page words
      </Link>
      <h1 className="mt-2 text-2xl">{block.title}</h1>

      <div className="mt-6">
        <ContentEditor
          contentKey={block.key}
          title={block.title}
          location={block.location}
          help={block.help}
          published={block.body}
          draft={block.draft}
        />
      </div>
    </>
  )
}
