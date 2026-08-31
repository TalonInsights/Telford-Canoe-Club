/**
 * P0-20 — pattern from 21st.dev "Empty State Card"
 * (https://21st.dev/@shadcnui-blocks/components/empty-state-01, MIT).
 * §3.4 rule: renders at the same min-height as one row of content so
 * sections never collapse; one icon, one sentence, one action.
 */

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] w-full items-center justify-center rounded-xl border border-stone bg-card',
        className
      )}
    >
      <div className="flex max-w-sm flex-col items-center gap-2 p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-foam">
          <Icon aria-hidden="true" className="size-6 text-river" />
        </span>
        <p className="font-heading text-lg font-semibold">{title}</p>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
