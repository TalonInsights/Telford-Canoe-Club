import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { EmailComposer } from '@/components/admin/email-composer'
import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth/guards'
import { formatDate } from '@/lib/format'
import { getCampaign, getSegmentCounts, segmentLabels, type EmailSegment } from '@/lib/queries/email'

export const metadata: Metadata = { title: 'Email' }

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const [, { id }] = await Promise.all([requireRole('committee'), params])
  const [campaign, counts] = await Promise.all([getCampaign(id), getSegmentCounts()])
  if (!campaign) notFound()

  const isDraft = campaign.status === 'draft'

  return (
    <>
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All emails
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl">{campaign.subject}</h1>
        <Badge variant={campaign.status === 'sent' ? 'success' : 'warn'}>
          {campaign.status === 'draft'
            ? 'Draft'
            : campaign.status === 'sending'
              ? 'Going out'
              : campaign.status === 'sent'
                ? 'Sent'
                : 'Problem'}
        </Badge>
      </div>

      {!isDraft && (
        <div className="mt-4 rounded-xl border border-stone bg-card p-4">
          <p className="text-sm text-ink-muted">
            Sent {campaign.sentAt ? formatDate(campaign.sentAt) : ''} to{' '}
            {campaign.segmentKey ? segmentLabels[campaign.segmentKey as EmailSegment].toLowerCase() : 'a group'}
            , {campaign.recipientCount ?? 0} recipients.
          </p>
          {campaign.counts && (
            <p className="mt-1 text-micro text-ink-muted">
              {campaign.counts.sent} away
              {campaign.counts.queued > 0 ? `, ${campaign.counts.queued} still going` : ''}
              {campaign.counts.failed > 0 ? `, ${campaign.counts.failed} did not send` : ''}.
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        <EmailComposer
          campaignId={campaign.id}
          counts={counts}
          readOnly={!isDraft}
          initial={{
            subject: campaign.subject,
            body: campaign.body,
            segment: campaign.segmentKey,
          }}
        />
      </div>
    </>
  )
}
