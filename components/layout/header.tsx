'use client'

/**
 * P0-06 — adapted from shadcnblocks "Navbar with Dropdowns"
 * (https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-navbar1, MIT).
 * Kept: solid bar + Sheet drawer pattern (radix focus trap), data-driven menu.
 * Changed: deep tone, signal active underline, Next Link + aria-current,
 * 44px touch targets, sentence case, CTA slot, members/admin variant hook.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useState } from 'react'

import { Container } from '@/components/layout/container'
import { ClubBadge, Wordmark } from '@/components/site/brand'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type NavItem = { title: string; href: string }

const siteNav: NavItem[] = [
  { title: 'Paddlesports', href: '/paddlesports' },
  { title: 'About', href: '/about' },
  { title: 'Venue', href: '/venue' },
  { title: 'Events', href: '/events' },
  { title: 'News', href: '/news' },
  { title: 'Contact', href: '/contact' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  item,
  pathname,
  className,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  className?: string
  onNavigate?: () => void
}) {
  const active = isActive(pathname, item.href)
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'relative flex min-h-11 items-center px-1 font-medium text-white/90 transition-colors hover:text-white',
        'after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-signal after:opacity-0 after:transition-opacity',
        active && 'text-white after:opacity-100',
        className
      )}
    >
      {item.title}
    </Link>
  )
}

export function Header({ items = siteNav, cta }: { items?: NavItem[]; cta?: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const defaultCta = (
    <Button asChild variant="signal" size="sm">
      <Link href="/join">Join the club</Link>
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-deep text-white">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="Telford Canoe Club home">
            <ClubBadge className="size-10" />
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-5 text-sm lg:flex">
            {items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="flex min-h-11 items-center px-2 text-sm font-medium text-white/90 hover:text-white"
            >
              Log in
            </Link>
            {cta ?? defaultCta}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="text-white hover:bg-river hover:text-white lg:hidden"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-river bg-deep text-white">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-white">
                  <ClubBadge className="size-9" />
                  <Wordmark size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Main" className="flex flex-col gap-1 px-4">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                    className="min-h-12 border-b border-river/60 text-base after:hidden aria-[current=page]:text-signal-soft"
                  />
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-4">
                <Button asChild variant="signal" onClick={() => setOpen(false)}>
                  <Link href="/join">Join the club</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-white hover:bg-river hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}
