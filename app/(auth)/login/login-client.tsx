'use client'

import { toast } from 'sonner'

import { magicLinkAction, signInAction } from '@/lib/actions/auth'
import { SignInForm } from '@/components/site/auth-forms'

export function LoginClient() {
  return (
    <SignInForm
      onPassword={async (values) => {
        const result = await signInAction(values)
        // A successful sign-in redirects server-side; reaching here means failure.
        if (result && !result.ok) toast.error(result.message)
      }}
      onMagicLink={async (values) => {
        const result = await magicLinkAction(values)
        if (result.ok) toast.success(result.message ?? 'Check your email')
        else toast.error(result.message)
      }}
    />
  )
}
