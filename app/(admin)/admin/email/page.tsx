import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { requireRole } from '@/lib/auth/guards'
import { campaignPreview } from '@/lib/email/campaign'
import { formatDate } from '@/lib/format'
import { getCampaigns, segmentLabels, type EmailSegment } from '@/lib/queries/email'

export const metadata: Metadata = { title: 'Email the members' }

const statusTone: Record<string, 'default' | 'success' | 'warn'> = {
  draft: 'warn',
  sending: 'warn',
  sent: 'success',
  failed: 'warn',
}

export default async function AdminEmailPage() {
  const [, campaigns] = await Promise.all([requireRole('committee'), getCampaigns()])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Email the members</h1>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            Club news to a chosen group. Everything sent from here carries an unsubscribe link, and
            anybody who has switched club news off is left out automatically.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/email/new">
            <Plus aria-hidden="true" /> Write an email
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Mail}
            title="Nothing sent yet"
            description="Write your first email to the members. You can preview it and send yourself a copy before it goes anywhere."
            action={
              <Button asChild>
                <Link href="/admin/email/new">Write an email</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/email/${c.id}`}
                className="block rounded-xl border border-stone bg-card p-4 transition-colors hover:border-river"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.subject}</span>
                  <Badge variant={statusTone[c.status] ?? 'default'}>
                    {c.status === 'draft'
                      ? 'Draft'
                      : c.status === 'sending'
                        ? 'Going out'
                        : c.status === 'sent'
                          ? 'Sent'
                          : 'Problem'}
                  </Badge>
                  <span className="ml-auto text-sm text-ink-muted">
                    {c.sentAt ? formatDate(c.sentAt) : formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-ink-muted">
                  {campaignPreview(c.body) || 'Nothing written yet'}
                </p>
                <p className="mt-1 text-micro text-ink-muted">
                  {c.segmentKey ? segmentLabels[c.segmentKey as EmailSegment] : 'No group chosen'}
                  {c.recipientCount !== null ? ` · ${c.recipientCount} recipients` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
