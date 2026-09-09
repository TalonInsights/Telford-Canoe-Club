import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { EmailComposer } from '@/components/admin/email-composer'
import { requireRole } from '@/lib/auth/guards'
import { getSegmentCounts } from '@/lib/queries/email'

export const metadata: Metadata = { title: 'Write an email' }

export default async function NewCampaignPage() {
  const [, counts] = await Promise.all([requireRole('committee'), getSegmentCounts()])

  return (
    <>
      <Link
        href="/admin/email"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All emails
      </Link>
      <h1 className="mt-2 text-2xl">Write an email</h1>
      <div className="mt-6">
        <EmailComposer counts={counts} />
      </div>
    </>
  )
}
