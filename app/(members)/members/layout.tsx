import Link from 'next/link'

import { BottomTabBar, type RailLink } from '@/components/admin/shell-nav'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { MembersSubnav } from '@/components/members/subnav'
import { Button } from '@/components/ui/button'
import { getSession, roleAtLeast } from '@/lib/auth/guards'
import { getClubSettings } from '@/lib/queries/settings'
import { signOutAction } from '@/lib/actions/auth'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'

const links: RailLink[] = [
  { title: 'Overview', href: '/members', icon: 'home' },
  { title: 'Membership', href: '/members/membership', icon: 'id' },
  { title: 'Events', href: '/members/events', icon: 'calendar' },
  { title: 'Shop', href: '/members/shop', icon: 'bag' },
  { title: 'Documents', href: '/members/documents', icon: 'file' },
  { title: 'Minutes', href: '/members/minutes', icon: 'clipboard' },
  { title: 'Notices', href: '/members/notices', icon: 'megaphone' },
  { title: 'Profile', href: '/members/profile', icon: 'user' },
]

// The bottom bar on a phone holds five; minutes and notices live one tap
// deeper, from the documents page and the overview.

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getSession(), getClubSettings()])

  // "Who is on site" appears only while the committee has it switched on, so
  // a feature the club has not agreed to does not advertise itself.
  const navLinks = settings.checkinsEnabled
    ? [...links.slice(0, 3), { title: 'On site', href: '/members/on-site', icon: 'users' }, ...links.slice(3)]
    : links

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-deep px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header
        account={
          session
            ? {
                firstName: session.profile.first_name,
                lastName: session.profile.last_name,
                isCurrentMember: session.isCurrentMember,
                isCommittee: roleAtLeast(session.profile.role, 'committee'),
              }
            : null
        }
      />
      <main id="main" className="flex-1 bg-foam pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">
          {!isSupabaseConfigured() ? (
            <div className="rounded-xl border border-stone bg-card p-8 text-center">
              <h1 className="text-2xl">Members area</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{NOT_CONFIGURED_MESSAGE}</p>
            </div>
          ) : !session ? (
            <div className="rounded-xl border border-stone bg-card p-8 text-center">
              <h1 className="text-2xl">Log in to continue</h1>
              <p className="mt-2 text-sm text-ink-muted">The members area needs an account.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild variant="signal">
                  <Link href="/join">Join the club</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl">Hello, {session.profile.first_name || 'paddler'}</h1>
                  <p className="text-sm text-ink-muted">
                    {session.isCurrentMember
                      ? 'Current member'
                      : 'Account registered, membership not active yet'}
                    {roleAtLeast(session.profile.role, 'committee') && (
                      <>
                        {' · '}
                        <Link href="/admin" className="font-medium text-river underline-offset-4 hover:underline">
                          Committee admin
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <form action={signOutAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Log out
                  </Button>
                </form>
              </div>
              <MembersSubnav links={navLinks.map(({ title, href }) => ({ title, href }))} />
              <div className="mt-6">{children}</div>
            </>
          )}
        </div>
      </main>
      {session && <BottomTabBar links={navLinks.slice(0, 5)} rootHref="/members" />}
      <Footer />
    </>
  )
}
