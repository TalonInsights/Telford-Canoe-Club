'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { signUpAction } from '@/lib/actions/auth'
import { SignUpForm } from '@/components/site/auth-forms'

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
        if (result.ok) {
          setDone(result.message ?? 'Check your email to verify your account.')
          toast.success('Account created')
          router.prefetch('/welcome')
        } else {
          toast.error(result.message)
        }
      }}
    />
  )
}
