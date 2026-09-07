import type { Metadata } from 'next'
import { MailCheck } from 'lucide-react'

import { LoginClient } from './login-client'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to the Telford Canoe Club members area.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const { notice } = await searchParams
  return (
    <div className="grid w-full max-w-md gap-4">
      {notice === 'verified' && (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-card p-4" role="status">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-medium text-success">Email verified.</span>{' '}
            <span className="text-ink-muted">Log in below to carry on.</span>
          </p>
        </div>
      )}
      <LoginClient />
    </div>
  )
}
