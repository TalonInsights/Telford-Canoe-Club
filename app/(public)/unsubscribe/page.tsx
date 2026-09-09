import type { Metadata } from 'next'
import Link from 'next/link'
import { CircleAlert, MailX } from 'lucide-react'

import { PageHero } from '@/components/layout/page-hero'
import { Section } from '@/components/layout/section'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
}

/**
 * One click, no login. The token in the link is the only thing needed, which
 * is what makes an unsubscribe link in an email actually work. It only ever
 * switches club news off: booking, membership and account emails are separate
 * and keep arriving, which the page says plainly.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  let done = false
  let name = ''
  if (token && isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase.rpc('unsubscribe_by_token', { p_token: token })
    const result = data as { ok?: boolean; name?: string } | null
    done = Boolean(result?.ok)
    name = result?.name ?? ''
  }

  return (
    <>
      <PageHero
        title={done ? 'You are unsubscribed' : 'Unsubscribe'}
        intro={
          done
            ? 'You will not get any more club news emails.'
            : 'We could not match that link to an account.'
        }
      />
      <Section tone="white">
        <div className="mx-auto w-full max-w-[560px] rounded-xl border border-stone bg-card p-6 text-center">
          {done ? (
            <>
              <MailX aria-hidden="true" className="mx-auto size-8 text-river" />
              <p className="mt-3">
                {name ? `That's done, ${name}.` : "That's done."} You have been taken off the club
                news list.
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Emails about your membership, your bookings and your account are separate and will
                still reach you. If you change your mind you can switch club news back on in your
                profile.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/members/profile">My profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to the site</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <CircleAlert aria-hidden="true" className="mx-auto size-8 text-warn" />
              <p className="mt-3">
                That link did not work. It may have been broken by your email program, or it may
                already have been used.
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                You can switch club news off yourself in your profile, or email the committee and
                we will do it for you.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/members/profile">My profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact the committee</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </Section>
    </>
  )
}
