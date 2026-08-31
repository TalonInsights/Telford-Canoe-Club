'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export function MembersSubnav({ links }: { links: { title: string; href: string }[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Members" className="mt-5 hidden border-b border-stone lg:block">
      <ul className="flex gap-1">
        {links.map((link) => {
          const active =
            link.href === '/members' ? pathname === '/members' : pathname.startsWith(link.href)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 items-center px-3 text-sm font-medium transition-colors',
                  'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-river after:opacity-0',
                  active ? 'text-ink after:opacity-100' : 'text-ink-muted hover:text-ink'
                )}
              >
                {link.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
