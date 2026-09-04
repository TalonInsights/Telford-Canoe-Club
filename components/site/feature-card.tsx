import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * DR-08 — one icon-card anatomy for facts and steps (facilities, venue
 * practicalities, how joining works, sessions). Shape from 21st.dev
 * "Feature 72" (https://21st.dev/@shadcnblockscom/components/feature-72, MIT):
 * icon tile → title → body. Rebuilt on TCC tokens — stone border, 12px radius,
 * no shadow, river icon on a foam tile. `step` swaps the tile for a numbered
 * deep marker so a sequence reads as one; equal heights come from the grid.
 */
export function FeatureCard({
  icon: Icon,
  step,
  title,
  body,
  className,
  children,
}: {
  icon?: LucideIcon
  step?: number
  title: string
  body: string
  className?: string
  children?: React.ReactNode
}) {
  const hasMarker = Icon !== undefined || step !== undefined
  return (
    <div className={cn('flex h-full flex-col rounded-xl border border-stone bg-card p-5', className)}>
      {hasMarker && (
        <span
          className={cn(
            'flex size-11 items-center justify-center rounded-lg',
            step !== undefined ? 'bg-deep font-heading text-lg font-semibold text-white tabular-nums' : 'bg-foam'
          )}
          aria-hidden={step === undefined ? 'true' : undefined}
        >
          {step !== undefined ? (
            <>
              <span className="sr-only">Step </span>
              {step}
            </>
          ) : (
            Icon && <Icon className="size-5 text-river" aria-hidden="true" />
          )}
        </span>
      )}
      <h3 className={cn('text-lg', hasMarker && 'mt-3')}>{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
      {children}
    </div>
  )
}
