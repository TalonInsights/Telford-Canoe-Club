import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { countSections, minutesPreview } from '@/lib/minutes/blocks'
import { getPublishedMinutes } from '@/lib/queries/minutes'

export const metadata: Metadata = { title: 'Meeting minutes' }

export default async function MemberMinutesPage() {
  const [, minutes] = await Promise.all([requireCurrentMember(), getPublishedMinutes()])

  return (
    <>
      <h1 className="text-2xl">Meeting minutes</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        What the committee discussed and decided on your behalf. Published after each meeting.
      </p>

      {minutes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ClipboardList}
            title="Nothing published yet"
            description="The committee publishes minutes here after each meeting. Check back after the next one."
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {minutes.map((m) => (
            <li key={m.id}>
              <Link
                href={`/members/minutes/${m.id}`}
                className="block rounded-xl border border-stone bg-card p-4 transition-colors hover:border-river"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg">{m.title}</h2>
                  <span className="text-sm text-ink-muted">{formatDate(m.meeting_date)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{minutesPreview(m.body)}</p>
                <p className="mt-1 text-micro text-ink-muted">
                  {countSections(m.body)} sections{m.attachment_path ? ' · signed copy attached' : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
