import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

import { BottomTabBar, SidebarRail, type RailLink } from '@/components/admin/shell-nav'
import { ClubBadge } from '@/components/site/brand'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { signOutAction } from '@/lib/actions/auth'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · TCC admin' } }

const links: RailLink[] = [
  { title: 'Overview', href: '/admin', icon: 'home' },
  { title: 'Members', href: '/admin/members', icon: 'users' },
  { title: 'Add a membership', href: '/admin/members/new', icon: 'user-plus' },
  { title: 'Events', href: '/admin/events', icon: 'calendar' },
  { title: 'Club shop', href: '/admin/shop', icon: 'bag' },
  { title: 'Email members', href: '/admin/email', icon: 'mail' },
  { title: 'Minutes', href: '/admin/minutes', icon: 'clipboard' },
  { title: 'Documents', href: '/admin/documents', icon: 'file' },
  { title: 'Page words', href: '/admin/content', icon: 'pencil' },
  { title: 'River levels', href: '/admin/river-levels', icon: 'waves' },
  { title: 'Committee', href: '/admin/committee', icon: 'id' },
  { title: 'Audit log', href: '/admin/audit', icon: 'history' },
  { title: 'Memberships on sale', href: '/admin/membership-types', icon: 'id' },
  { title: 'Settings', href: '/admin/settings', icon: 'settings' },
]

// The five that earn a place on a phone: the everyday jobs.
const tabBarLinks = [links[0], links[1], links[3], links[4], links[5]]

const exitLinkClass =
  'flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-stone transition-colors hover:bg-river/50 hover:text-white'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('committee')

  return (
    <div className="flex min-h-svh bg-foam">
      <SidebarRail
        title="TCC admin"
        rootHref="/admin"
        groups={[
          { title: 'Club', links: links.slice(0, 6) },
          { title: 'Records', links: links.slice(6, 12) },
          { title: 'Setup', links: links.slice(12) },
        ]}
        footer={
          <div className="grid gap-3">
            {/* The way back out, the rail otherwise only knows admin pages. */}
            <nav aria-label="Leave admin" className="grid gap-0.5">
              <Link href="/members" className={exitLinkClass}>
                <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
                Members area
              </Link>
              <Link href="/" className={exitLinkClass}>
                <Globe aria-hidden="true" className="size-4 shrink-0" />
                Public site
              </Link>
            </nav>
            <form action={signOutAction} className="border-t border-river/60 pt-3">
              <p className="mb-2 truncate text-micro text-stone">{session.email}</p>
              <Button type="submit" variant="inverse" size="sm" className="w-full">
                Log out
              </Button>
            </form>
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile and tablet: the bottom tab bar is full, so the way back lives up here. */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/10 bg-deep px-4 text-white lg:hidden">
          <Link href="/admin" className="flex min-h-11 items-center gap-2.5 font-heading font-semibold">
            <ClubBadge className="size-8" />
            TCC admin
          </Link>
          <Link
            href="/members"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-stone hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Members area
          </Link>
        </header>
        <main id="main" className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">{children}</div>
        </main>
      </div>
      <BottomTabBar links={tabBarLinks} rootHref="/admin" />
    </div>
  )
}
