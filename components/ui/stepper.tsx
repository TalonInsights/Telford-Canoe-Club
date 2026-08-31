/**
 * P0-21 — pattern from 21st.dev originui "Stepper"
 * (https://21st.dev/@originui/components/stepper, MIT), simplified to the
 * three-step register → tier → pay flow: numbered markers, aria-current on
 * the active step, condensed labels on mobile (numbers always visible).
 */

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn('flex min-w-0 items-center gap-2', i < steps.length - 1 && 'flex-1')}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                state === 'done' && 'bg-success text-white',
                state === 'current' && 'bg-deep text-white',
                state === 'todo' && 'border border-stone bg-card text-ink-muted'
              )}
            >
              {state === 'done' ? <Check aria-hidden="true" className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden truncate text-sm sm:block',
                state === 'current' ? 'font-medium' : 'text-ink-muted'
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-0.5 min-w-4 flex-1 rounded-full',
                  i < current ? 'bg-success' : 'bg-stone'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
