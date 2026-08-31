import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Verify your email' }

export default function VerifyPage() {
  return (
    <div className="w-full max-w-md rounded-xl border border-stone bg-card p-6 text-center sm:p-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-foam">
        <MailCheck className="size-6 text-success" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl">Email verified</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Your account is ready. Next step: choose your membership tier.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button asChild variant="signal">
          <Link href="/welcome">Choose your membership</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/members">Go to the members area</Link>
        </Button>
      </div>
    </div>
  )
}
