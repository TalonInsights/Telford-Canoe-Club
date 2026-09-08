import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Paperclip } from 'lucide-react'

import { MinutesView } from '@/components/site/minutes-view'
import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { getMinutesById } from '@/lib/queries/minutes'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Meeting minutes' }

export default async function MemberMinutesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [, minutes] = await Promise.all([requireCurrentMember(), getMinutesById(id)])

  // RLS returns nothing for an unpublished set unless the reader is on the
  // committee, so a draft is a 404 to a member rather than a forbidden page.
  if (!minutes || minutes.status !== 'published') notFound()

  let attachmentUrl: string | null = null
  if (minutes.attachment_path) {
    const supabase = await createClient()
    const { data } = await supabase.storage
      .from('documents-members')
      .createSignedUrl(minutes.attachment_path, 3600)
    attachmentUrl = data?.signedUrl ?? null
  }

  return (
    <>
      <Link
        href="/members/minutes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All minutes
      </Link>

      <article className="mt-2 rounded-xl border border-stone bg-card p-6 md:p-8">
        <p className="text-micro font-medium text-river">{formatDate(minutes.meeting_date)}</p>
        <h1 className="mt-1 text-2xl">{minutes.title}</h1>

        <div className="mt-6">
          <MinutesView body={minutes.body} />
        </div>

        {attachmentUrl && (
          <p className="mt-8 border-t border-stone pt-4 text-sm">
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-river underline-offset-4 hover:underline"
            >
              <Paperclip aria-hidden="true" className="size-4" />
              {minutes.attachment_name ?? 'Signed copy'}
            </a>
          </p>
        )}
      </article>
    </>
  )
}
