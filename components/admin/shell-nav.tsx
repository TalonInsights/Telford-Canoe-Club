'use client'

/**
 * P0-19 — rail pattern from 21st.dev "Sidebar Nav Group"
 * (https://21st.dev/@felipemenezes098/components/collapsible-05, MIT):
 * grouped links, chevron collapse, keyboard navigable. Rebuilt to §3.4:
 * fixed 240px deep rail at ≥1024px; the mobile counterpart is a separate
 * 56px safe-area-padded bottom tab bar (5 items max), not a collapsed rail.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export type RailLink = { title: string; href: string; icon?: LucideIcon }
export type RailGroup = { title: string; links: RailLink[] }

function railActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarRail({
  title,
  groups,
  rootHref,
  footer,
}: {
  title: string
  groups: RailGroup[]
  rootHref: string
  footer?: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-deep text-white lg:flex">
      <Link href={rootHref} className="flex min-h-16 items-center px-5 font-heading font-semibold">
        {title}
      </Link>
      <nav aria-label={title} className="flex grow flex-col gap-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.title]
          return (
            <div key={group.title}>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() => setCollapsed((c) => ({ ...c, [group.title]: !c[group.title] }))}
                className="flex min-h-9 w-full items-center justify-between rounded-lg px-2 text-micro font-medium tracking-wide text-stone"
              >
                {group.title}
                <ChevronDown
                  aria-hidden="true"
                  className={cn('size-3.5 transition-transform', isCollapsed && '-rotate-90')}
                />
              </button>
              {!isCollapsed && (
                <ul className="mt-1 space-y-0.5">
                  {group.links.map((link) => {
                    const active = railActive(pathname, link.href, link.href === rootHref)
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                            active
                              ? 'bg-river font-medium text-white'
                              : 'text-stone hover:bg-river/50 hover:text-white'
                          )}
                        >
                          {link.icon && <link.icon aria-hidden="true" className="size-4 shrink-0" />}
                          {link.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      {footer && <div className="border-t border-river/60 p-4">{footer}</div>}
    </aside>
  )
}

/** Mobile counterpart: 5-item bottom tab bar, 56px + safe area (§3.4). */
export function BottomTabBar({ links, rootHref }: { links: RailLink[]; rootHref: string }) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-river/60 bg-deep pb-[env(safe-area-inset-bottom)] text-white lg:hidden"
    >
      <ul className="flex h-14">
        {links.slice(0, 5).map((link) => {
          const active = railActive(pathname, link.href, link.href === rootHref)
          return (
            <li key={link.href} className="min-w-0 flex-1">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-micro',
                  active ? 'text-white' : 'text-stone'
                )}
              >
                {link.icon && (
                  <link.icon
                    aria-hidden="true"
                    className={cn('size-5', active && 'text-signal-soft')}
                  />
                )}
                <span className="max-w-full truncate px-1">{link.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
