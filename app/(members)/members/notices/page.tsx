import type { Metadata } from 'next'
import { Megaphone, Pin } from 'lucide-react'

import { requireCurrentMember } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { getMemberNotices } from '@/lib/queries/members'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Notices' }

export default async function NoticesPage() {
  await requireCurrentMember()
  const notices = await getMemberNotices()

  if (notices.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No notices right now"
        description="Gate codes and members-only announcements appear here when the committee posts them."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {notices.map((n) => (
        <article key={n.id} className="rounded-xl border border-stone bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg">
            {n.pinned && <Pin className="size-4 text-signal" aria-label="Pinned" />}
            {n.title}
          </h2>
          <p className="mt-1 text-micro text-ink-muted">{formatDate(n.created_at)}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{n.body}</p>
        </article>
      ))}
    </div>
  )
}
