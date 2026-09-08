import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/format'
import { countSections, minutesPreview } from '@/lib/minutes/blocks'
import { getAllMinutes } from '@/lib/queries/minutes'

export const metadata: Metadata = { title: 'Meeting minutes' }

export default async function AdminMinutesPage() {
  const minutes = await getAllMinutes()
  const drafts = minutes.filter((m) => m.status !== 'published').length

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Meeting minutes</h1>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            Written up here from the club&apos;s usual running order. Published minutes are
            readable by every current member in their{' '}
            <Link href="/members/minutes" className="underline underline-offset-2">
              members area
            </Link>
            . Drafts stay with the committee.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/minutes/new">
            <Plus aria-hidden="true" /> Write up a meeting
          </Link>
        </Button>
      </div>

      {minutes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No minutes yet"
            description="Write up your first meeting and members will be able to read it as soon as you publish."
            action={
              <Button asChild>
                <Link href="/admin/minutes/new">Write up a meeting</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
            {minutes.length} {minutes.length === 1 ? 'set of minutes' : 'sets of minutes'}
            {drafts > 0 ? `, ${drafts} still a draft` : ''}
          </p>
          <ul className="mt-2 grid gap-3">
            {minutes.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/minutes/${m.id}`}
                  className="block rounded-xl border border-stone bg-card p-4 transition-colors hover:border-river"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.title}</span>
                    <Badge variant={m.status === 'published' ? 'success' : 'warn'}>
                      {m.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="ml-auto text-sm text-ink-muted">
                      {formatDate(m.meeting_date)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                    {minutesPreview(m.body) || 'Nothing written yet'}
                  </p>
                  <p className="mt-1 text-micro text-ink-muted">
                    {countSections(m.body)} sections
                    {m.attachment_path ? ' · signed copy attached' : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
