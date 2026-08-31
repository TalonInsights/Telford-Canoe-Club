'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { resetPasswordAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="w-full max-w-md rounded-xl border border-stone bg-card p-6 sm:p-8">
      <h1 className="text-2xl">Set a new password</h1>
      <form
        noValidate
        className="mt-4 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (password.length < 10) {
            setError('Use at least 10 characters — a short sentence works well')
            return
          }
          setSubmitting(true)
          const result = await resetPasswordAction(password)
          setSubmitting(false)
          if (result && !result.ok) {
            setError(result.message)
            toast.error(result.message)
          }
        }}
      >
        <Field
          label="New password"
          htmlFor="rp-password"
          helper="At least 10 characters — a short sentence works well."
          error={error ?? undefined}
        >
          <Input
            id="rp-password"
            type="password"
            autoComplete="new-password"
            value={password}
            aria-invalid={!!error}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error && e.target.value.length >= 10) setError(null)
            }}
          />
        </Field>
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save new password'}
          </Button>
        </div>
      </form>
    </div>
  )
}
