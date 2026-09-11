'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { signUpAction } from '@/lib/actions/auth'
import { SignUpForm } from '@/components/site/auth-forms'

/**
 * Where a new account goes next depends on whether it is usable straight away.
 * The action reports that from what the auth service actually did, so this
 * screen is correct whether or not the club has email confirmation switched
 * on, and never tells somebody to check an inbox that will stay empty.
 */
export function RegisterClient() {
  const router = useRouter()
  const [done, setDone] = useState<string | null>(null)

  if (done) {
    return (
      <div className="rounded-lg border border-success/30 bg-foam p-5">
        <h2 className="text-lg text-success">Nearly there</h2>
        <p className="mt-1 text-sm text-ink-muted">{done}</p>
      </div>
    )
  }

  return (
    <SignUpForm
      onSubmit={async (values) => {
        const result = await signUpAction(values)
        if (!result.ok) {
          toast.error(result.message)
          return
        }
        toast.success('Account created')
        if (result.signedIn) {
          // Already signed in, so carry straight on to choosing a membership.
          router.push('/welcome')
          router.refresh()
        } else {
          setDone(result.message ?? 'Check your email to verify your account.')
        }
      }}
    />
  )
}
