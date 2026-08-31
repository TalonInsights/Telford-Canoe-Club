import type { Metadata } from 'next'

import { RegisterClient } from './register-client'

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Register with Telford Canoe Club, then choose your membership tier.',
}

export default function RegisterPage() {
  return (
    <div className="w-full max-w-xl">
      <div className="rounded-xl border border-stone bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Step 1 of joining the club — after this you&apos;ll choose a membership tier.
        </p>
        <div className="mt-6">
          <RegisterClient />
        </div>
      </div>
    </div>
  )
}
