/**
 * §3.5 rule 2 form conventions in one place: label above the field,
 * helper text under the label, error in signal with an icon and a specific
 * fix, and an error summary block for the top of the form on submit.
 */

import { CircleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Field({
  label,
  htmlFor,
  helper,
  error,
  optional,
  children,
  className,
}: {
  label: string
  htmlFor: string
  helper?: string
  error?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {helper && <p className="text-micro text-ink-muted">{helper}</p>}
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-sm text-signal" role="alert">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export function ErrorSummary({ errors, title }: { errors: string[]; title?: string }) {
  if (errors.length === 0) return null
  return (
    <div
      role="alert"
      tabIndex={-1}
      className="rounded-lg border border-signal/40 bg-signal-soft p-4"
    >
      <p className="flex items-center gap-2 font-medium text-signal">
        <CircleAlert aria-hidden="true" className="size-4" />
        {title ?? 'Check the form and try again'}
      </p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-signal">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  )
}
