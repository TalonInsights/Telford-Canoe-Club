import { cn } from '@/lib/utils'

import { Container } from './container'

type Tone = 'foam' | 'white' | 'deep'

const toneClass: Record<Tone, string> = {
  foam: 'bg-foam text-ink',
  white: 'bg-card text-ink',
  deep: 'bg-deep text-white',
}

/**
 * §3.4: sections only ever use --space-section or --space-section-tight, and
 * the gap between the title block and content is always --space-title-gap.
 * Adjacent sections must alternate tone (audit rule ②) — that is enforced at
 * page level, this component just makes the tones the only options.
 */
export function Section({
  tone = 'foam',
  spacing = 'default',
  title,
  intro,
  action,
  className,
  children,
}: {
  tone?: Tone
  spacing?: 'default' | 'tight'
  title?: string
  intro?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        toneClass[tone],
        spacing === 'default' ? 'py-section' : 'py-section-tight',
        className
      )}
    >
      <Container>
        {(title || intro || action) && (
          <div className="mb-title-gap flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[68ch]">
              {title && <h2>{title}</h2>}
              {intro && (
                <p className={cn('mt-2', tone === 'deep' ? 'text-stone' : 'text-ink-muted')}>
                  {intro}
                </p>
              )}
            </div>
            {action}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
