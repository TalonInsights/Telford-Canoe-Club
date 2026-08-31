'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { sendContactAction } from '@/lib/actions/contact'
import { Button } from '@/components/ui/button'
import { ErrorSummary, Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name'),
  email: z.email('Enter an email we can reply to'),
  message: z.string().trim().min(10, 'Say a little more so we can help properly'),
  // Honeypot — humans never see or fill this.
  website: z.string().max(0).optional(),
})

export type ContactValues = z.infer<typeof contactSchema>

export function ContactForm() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })
  const [sent, setSent] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const { errors, isSubmitting } = form.formState

  if (sent) {
    return (
      <div className="rounded-xl border border-success/30 bg-card p-6">
        <h2 className="text-xl text-success">Message sent</h2>
        <p className="mt-2 text-sm text-ink-muted">{sent}</p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setFailed(null)
        const result = await sendContactAction(values)
        if (result.ok) setSent(result.message ?? 'The committee will come back to you soon.')
        else setFailed(result.message)
      })}
      className="grid gap-4 rounded-xl border border-stone bg-card p-6"
    >
      <ErrorSummary
        errors={[
          ...Object.values(errors).map((e) => e?.message ?? '').filter(Boolean),
          ...(failed ? [failed] : []),
        ]}
      />
      <Field label="Your name" htmlFor="c-name" error={errors.name?.message}>
        <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
      </Field>
      <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
        <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
      </Field>
      <Field label="Message" htmlFor="c-message" error={errors.message?.message}>
        <Textarea id="c-message" rows={6} aria-invalid={!!errors.message} {...form.register('message')} />
      </Field>
      <div aria-hidden="true" className="hidden">
        <label htmlFor="c-website">Leave this empty</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...form.register('website')} />
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  )
}
