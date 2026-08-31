/**
 * P0-18 — pattern from 21st.dev "KPI Card"
 * (https://21st.dev/@nayan_radadiya6/components/kpi-card, MIT). No sparklines
 * per §3.6; delta is word + colour, never colour alone; values tabular.
 */

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  className,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: 'neutral' | 'success' | 'warn' | 'signal'
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-stone bg-card p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {Icon && <Icon aria-hidden="true" className="size-4 text-ink-muted" />}
      </div>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{value}</p>
      {hint && (
        <p
          className={cn(
            'mt-1 text-micro',
            tone === 'neutral' && 'text-ink-muted',
            tone === 'success' && 'text-success',
            tone === 'warn' && 'text-warn',
            tone === 'signal' && 'text-signal'
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
