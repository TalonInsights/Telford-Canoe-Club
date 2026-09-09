import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

import { OnSiteBoard } from '@/components/members/on-site'
import { requireCurrentMember } from '@/lib/auth/guards'
import { getUpcomingCheckins } from '@/lib/queries/checkins'
import { getClubSettings } from '@/lib/queries/settings'

export const metadata: Metadata = {
  title: 'Who is on site',
  // Never indexed. It is members-only data about where named people will be.
  robots: { index: false, follow: false },
}

export default async function OnSitePage() {
  const [, settings] = await Promise.all([requireCurrentMember(), getClubSettings()])

  // Switched off until the committee has decided visibility, name format and
  // retention. Off means the page does not exist, not that it is empty.
  if (!settings.checkinsEnabled) notFound()

  const checkins = await getUpcomingCheckins()

  return (
    <>
      <h1 className="text-2xl">Who is on site</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        Say when you are going to be at Jackfield, and see who else is planning to be there. This
        is social: turning up at the same time as someone else, not a coached session.
      </p>

      <div className="mt-6">
        <OnSiteBoard checkins={checkins} />
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-stone bg-card p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-river" />
        <div className="text-sm text-ink-muted">
          <p className="font-medium text-ink">What other people can see</p>
          <p className="mt-1">
            Only current members, only while they are logged in, and only your first name with your
            last initial. Nothing is public and nothing is sent to anybody when you post. Entries
            disappear once the session has passed and are deleted within a day, so no record of
            where you have been is kept. Under-18 accounts cannot post here.
          </p>
        </div>
      </div>
    </>
  )
}
