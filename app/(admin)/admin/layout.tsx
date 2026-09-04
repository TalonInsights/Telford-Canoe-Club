import type { Metadata } from 'next'
import { BottomTabBar, SidebarRail, type RailLink } from '@/components/admin/shell-nav'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { signOutAction } from '@/lib/actions/auth'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s — TCC admin' } }

const links: RailLink[] = [
  { title: 'Overview', href: '/admin', icon: 'home' },
  { title: 'Members', href: '/admin/members', icon: 'users' },
  { title: 'Add a membership', href: '/admin/members/new', icon: 'user-plus' },
  { title: 'Committee', href: '/admin/committee', icon: 'id' },
  { title: 'Audit log', href: '/admin/audit', icon: 'clipboard' },
  { title: 'Settings', href: '/admin/settings', icon: 'settings' },
]

const tabBarLinks = [links[0], links[1], links[3], links[5]]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('committee')

  return (
    <div className="flex min-h-svh bg-foam">
      <SidebarRail
        title="TCC admin"
        rootHref="/admin"
        groups={[
          { title: 'Club', links: links.slice(0, 3) },
          { title: 'Records', links: links.slice(3, 5) },
          { title: 'Setup', links: links.slice(5) },
        ]}
        footer={
          <form action={signOutAction}>
            <p className="mb-2 truncate text-micro text-stone">{session.email}</p>
            <Button type="submit" variant="inverse" size="sm" className="w-full">
              Log out
            </Button>
          </form>
        }
      />
      <main id="main" className="min-w-0 flex-1 pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">{children}</div>
      </main>
      <BottomTabBar links={tabBarLinks} rootHref="/admin" />
    </div>
  )
}
