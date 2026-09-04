import Link from 'next/link'

import { ClubBadge } from '@/components/site/brand'

/**
 * The gateway shell deliberately drops the site chrome — a checkout hop reads
 * as "you've left the site to pay", exactly as PayPal will when D1 lands.
 * No nav, one card, one way back.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-foam">
      <header className="border-b border-stone bg-card">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
          <span className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight text-ink">
            <ClubBadge className="size-8 text-deep" />
            Telford Canoe Club payments
          </span>
          <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-micro font-medium text-warn">
            Test mode
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-stone bg-card">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 text-micro text-ink-muted">
          Simulated payment gateway for testing — no money moves.{' '}
          <Link href="/members/membership" className="underline underline-offset-2">
            Return to Telford Canoe Club
          </Link>
        </div>
      </footer>
    </div>
  )
}
