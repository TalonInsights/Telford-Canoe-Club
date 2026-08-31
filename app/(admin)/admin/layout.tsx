import type { Metadata } from 'next'
import { ClipboardList, Home, IdCard, Users } from 'lucide-react'

import { BottomTabBar, SidebarRail, type RailLink } from '@/components/admin/shell-nav'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { signOutAction } from '@/lib/actions/auth'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s — TCC admin' } }

const links: RailLink[] = [
  { title: 'Overview', href: '/admin', icon: Home },
  { title: 'Members', href: '/admin/members', icon: Users },
  { title: 'Committee', href: '/about/committee', icon: IdCard },
  { title: 'Audit log', href: '/admin/audit', icon: ClipboardList },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('committee')

  return (
    <div className="flex min-h-svh bg-foam">
      <SidebarRail
        title="TCC admin"
        rootHref="/admin"
        groups={[
          { title: 'Club', links: links.slice(0, 2) },
          { title: 'Records', links: links.slice(2) },
        ]}
        footer={
          <form action={signOutAction}>
            <p className="mb-2 truncate text-micro text-stone">{session.email}</p>
            <Button type="submit" size="sm" className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20">
              Log out
            </Button>
          </form>
        }
      />
      <main id="main" className="min-w-0 flex-1 pb-20 lg:pb-0">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">{children}</div>
      </main>
      <BottomTabBar links={links} rootHref="/admin" />
    </div>
  )
}
