import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, FileText } from 'lucide-react'

import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { getMemberDocuments } from '@/lib/queries/documents'
import { getPublishedMinutes } from '@/lib/queries/minutes'
import { documentCategoryLabel, formatFileSize } from '@/lib/storage/documents'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DocumentList } from '@/components/site/document-list'

export const metadata: Metadata = { title: 'Members documents' }

/**
 * The members' library. Minutes are written in the site rather than uploaded,
 * so they get their own card at the top pointing at the reading pages; the
 * list below is the club's files. Each file is signed for an hour from the
 * bucket its visibility puts it in, so a members-only file is unreachable
 * without a session even if the link is passed on.
 */
export default async function MemberDocumentsPage() {
  const [, documents, minutes] = await Promise.all([
    requireCurrentMember(),
    getMemberDocuments(),
    getPublishedMinutes(),
  ])

  const latest = minutes[0]
  const files = documents
    .filter((d) => d.href)
    .map((d) => ({
      title: d.title,
      href: d.href as string,
      note: [
        documentCategoryLabel(d.category),
        d.version_label,
        formatFileSize(d.size_bytes),
      ]
        .filter(Boolean)
        .join(' · '),
    }))

  return (
    <>
      <h1 className="text-2xl">Documents</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        Club paperwork and the committee&apos;s meeting minutes, for members only.
      </p>

      <section className="mt-6 rounded-xl border border-stone bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg">
              <ClipboardList aria-hidden="true" className="size-5 text-river" />
              Meeting minutes
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {latest
                ? `Latest: ${latest.title}, ${formatDate(latest.meeting_date)}.`
                : 'The committee publishes minutes here after each meeting.'}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/members/minutes">
              {minutes.length > 0 ? `Read the minutes (${minutes.length})` : 'Open minutes'}
            </Link>
          </Button>
        </div>
      </section>

      <h2 className="mt-8 text-lg">Club files</h2>
      <div className="mt-2">
        {files.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nothing in the library yet"
            description="AGM papers and members-only documents appear here as the committee uploads them."
            action={
              <Button asChild variant="secondary">
                <Link href="/about/policies">Public policies</Link>
              </Button>
            }
          />
        ) : (
          <DocumentList documents={files} />
        )}
      </div>
    </>
  )
}
