import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { MinutesEditor } from '@/components/admin/minutes-editor'
import { MinutesStatusButtons } from '@/components/admin/minutes-status-buttons'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { getMinutesById } from '@/lib/queries/minutes'

export const metadata: Metadata = { title: 'Edit minutes' }

export default async function EditMinutesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const minutes = await getMinutesById(id)
  if (!minutes) notFound()

  return (
    <>
      <Link
        href="/admin/minutes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All minutes
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl">{minutes.title}</h1>
            <Badge variant={minutes.status === 'published' ? 'success' : 'warn'}>
              {minutes.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {formatDate(minutes.meeting_date)}
            {minutes.status === 'published'
              ? ', every current member can read these'
              : ', only the committee can see these'}
          </p>
        </div>
        <MinutesStatusButtons id={minutes.id} status={minutes.status} title={minutes.title} />
      </div>

      <div className="mt-6">
        <MinutesEditor
          minutesId={minutes.id}
          mode="edit"
          initial={{
            meetingDate: minutes.meeting_date,
            title: minutes.title,
            body: minutes.body,
            status: minutes.status,
            attachmentPath: minutes.attachment_path,
            attachmentName: minutes.attachment_name,
          }}
        />
      </div>
    </>
  )
}
