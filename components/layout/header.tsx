'use client'

/**
 * P0-06 — adapted from shadcnblocks "Navbar with Dropdowns"
 * (https://21st.dev/@shadcnblockscom/components/shadcnblocks-com-navbar1, MIT).
 * Kept: solid bar + Sheet drawer pattern (radix focus trap), data-driven menu.
 * Changed: deep tone, signal active underline, Next Link + aria-current,
 * 44px touch targets, sentence case, CTA slot, members/admin variant hook.
 *
 * Account slot: signed-out visitors see Log in + Join. A signed-in person
 * gets a compact account chip (initials + first name) opening a menu of their
 * pages and Log out; until a membership is active the signal button reads
 * "Choose a membership". Dynamic shells (members area) pass the session in;
 * the static public pages detect it in the browser so they stay cached — the
 * server always renders the signed-out slot and the swap happens right after
 * hydration from the auth cookie, before any network round trip.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Menu } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { signOutAction } from '@/lib/actions/auth'
import { Container } from '@/components/layout/container'
import { ClubBadge, Wordmark } from '@/components/site/brand'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type NavItem = { title: string; href: string }

/** What the header needs to know about the signed-in person. `null` = signed out. */
export type HeaderAccount = {
  firstName: string | null
  lastName?: string | null
  isCurrentMember: boolean
  isCommittee?: boolean
} | null

const siteNav: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Paddlesports', href: '/paddlesports' },
  { title: 'About', href: '/about' },
  { title: 'Venue', href: '/venue' },
  { title: 'Events', href: '/events' },
  { title: 'News', href: '/news' },
  { title: 'Contact', href: '/contact' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function hasAuthCookie() {
  return typeof document !== 'undefined' && /(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)
}

function initials(account: NonNullable<HeaderAccount>) {
  const letters = [account.firstName, account.lastName]
    .map((n) => n?.trim().charAt(0).toUpperCase() ?? '')
    .join('')
  return letters || '•'
}

/**
 * Browser-side detection for the static public pages: the cookie says
 * "someone is signed in" instantly; the profile + membership check refines
 * the chip a moment later.
 */
function useDetectedAccount(initial: HeaderAccount | undefined): HeaderAccount | undefined {
  const [account, setAccount] = useState<HeaderAccount | undefined>(initial)

  useEffect(() => {
    if (initial !== undefined) return
    let cancelled = false
    const configured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const supabase = configured ? createClient() : null

    async function resolve() {
      // Never set state synchronously inside the effect (cascading-render rule).
      await Promise.resolve()
      if (!supabase || !hasAuthCookie()) {
        if (!cancelled) setAccount(null)
        return
      }
      // getSession() reads the cookie locally — no network — so the slot
      // swaps within a frame; the membership check refines the chip after.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        if (!cancelled) setAccount(null)
        return
      }
      const meta = (key: string) =>
        typeof user.user_metadata?.[key] === 'string' ? (user.user_metadata[key] as string) : null
      if (!cancelled) {
        setAccount({ firstName: meta('first_name'), lastName: meta('last_name'), isCurrentMember: true })
      }
      const [{ data: profile }, { data: current }] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, role').eq('user_id', user.id).maybeSingle(),
        supabase.rpc('is_current_member', { uid: user.id }),
      ])
      if (!cancelled) {
        setAccount({
          firstName: profile?.first_name ?? meta('first_name'),
          lastName: profile?.last_name ?? meta('last_name'),
          isCurrentMember: Boolean(current),
          isCommittee: profile?.role === 'committee' || profile?.role === 'admin',
        })
      }
    }

    void resolve()
    const listener = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setAccount(null)
      if (event === 'SIGNED_IN') void resolve()
    })
    return () => {
      cancelled = true
      listener?.data.subscription.unsubscribe()
    }
  }, [initial])

  return account
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

/** The signed-in chip: initials, first name, and a menu of the person's pages. */
function AccountMenu({ account }: { account: NonNullable<HeaderAccount> }) {
  const [pending, startTransition] = useTransition()
  const name = account.firstName || 'My account'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pr-3 pl-1 text-sm font-medium text-white transition-colors hover:bg-white/[0.12] focus-visible:ring-3 focus-visible:ring-white/30 focus-visible:outline-none aria-expanded:bg-white/[0.12]"
          aria-label={`Account menu for ${name}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-river text-micro font-semibold tracking-wide"
          >
            {initials(account)}
          </span>
          <span className="max-w-32 truncate">{name}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 text-white/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-ink-muted">
          {account.isCurrentMember ? 'Current member' : 'Account registered, no membership yet'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {account.isCurrentMember ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/members">Members area</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/members/membership">My membership</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/members/events">My bookings</Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/welcome">Choose a membership</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/members/membership">My membership</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/members/profile">Profile</Link>
        </DropdownMenuItem>
        {account.isCommittee && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">Committee admin</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault()
            startTransition(() => signOutAction())
          }}
        >
          <LogOut aria-hidden="true" />
          {pending ? 'Logging out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header({
  items = siteNav,
  cta,
  account: accountProp,
}: {
  items?: NavItem[]
  cta?: React.ReactNode
  /** Pass from a dynamic layout to render the right slot on the server; omit to detect in the browser. */
  account?: HeaderAccount
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [signingOut, startSignOut] = useTransition()
  const account = useDetectedAccount(accountProp)

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

          <div className="hidden items-center gap-3 lg:flex">
            {account ? (
              <>
                {!account.isCurrentMember && (
                  <Button asChild variant="signal" size="sm">
                    <Link href="/welcome">Choose a membership</Link>
                  </Button>
                )}
                <AccountMenu account={account} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex min-h-11 items-center px-2 text-sm font-medium text-white/90 hover:text-white"
                >
                  Log in
                </Link>
                {cta ?? (
                  <Button asChild variant="signal" size="sm">
                    <Link href="/join">Join the club</Link>
                  </Button>
                )}
              </>
            )}
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
                {account ? (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/[0.06] p-3">
                      <span
                        aria-hidden="true"
                        className="flex size-9 items-center justify-center rounded-full bg-river text-sm font-semibold"
                      >
                        {initials(account)}
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium">{account.firstName || 'My account'}</p>
                        <p className="text-micro text-stone/85">
                          {account.isCurrentMember ? 'Current member' : 'No membership yet'}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="signal" onClick={() => setOpen(false)}>
                      <Link href={account.isCurrentMember ? '/members' : '/welcome'}>
                        {account.isCurrentMember ? 'Members area' : 'Choose a membership'}
                      </Link>
                    </Button>
                    {account.isCommittee && (
                      <Button asChild variant="inverse" onClick={() => setOpen(false)}>
                        <Link href="/admin">Committee admin</Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-river hover:text-white"
                      disabled={signingOut}
                      onClick={() => startSignOut(() => signOutAction())}
                    >
                      <LogOut aria-hidden="true" />
                      {signingOut ? 'Logging out…' : 'Log out'}
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}
