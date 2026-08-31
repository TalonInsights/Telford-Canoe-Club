'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { forgotPasswordAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { magicLinkSchema, type MagicLinkValues } from '@/lib/schemas/auth'

export default function ForgotPasswordPage() {
  const form = useForm<MagicLinkValues>({ resolver: zodResolver(magicLinkSchema), mode: 'onBlur' })
  const [sent, setSent] = useState(false)

  return (
    <div className="w-full max-w-md rounded-xl border border-stone bg-card p-6 sm:p-8">
      <h1 className="text-2xl">Forgotten password</h1>
      {sent ? (
        <p className="mt-3 text-sm text-ink-muted">
          Check your email — the reset link is on its way. It expires after an hour.
        </p>
      ) : (
        <form
          noValidate
          className="mt-4 grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await forgotPasswordAction(values)
            if (result.ok) setSent(true)
            else toast.error(result.message)
          })}
        >
          <Field
            label="Email"
            htmlFor="fp-email"
            helper="We'll send a link that lets you set a new password."
            error={form.formState.errors.email?.message}
          >
            <Input id="fp-email" type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
