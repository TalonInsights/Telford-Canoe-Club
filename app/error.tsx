'use client'

import { CircleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-foam px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-signal-soft">
          <CircleAlert aria-hidden="true" className="size-6 text-signal" />
        </span>
        <h1 className="mt-4">Something went wrong</h1>
        <p className="mt-3 text-ink-muted">
          That wasn&apos;t supposed to happen. Trying again usually fixes it; if it keeps
          happening, email the committee and tell them what you were doing.
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </main>
  )
}
