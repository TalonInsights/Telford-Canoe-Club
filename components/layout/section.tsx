import { BridgeArch } from '@/components/site/brand'
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
 *
 * DR-05 additions: an optional sentence-case `kicker` above the title (river
 * on light, stone on deep — wayfinding, not an all-caps label), and
 * `decor="arch"`, which lays the Iron Bridge line drawing into a deep field
 * behind the content (hidden below 768px so it never crowds copy).
 */
export function Section({
  tone = 'foam',
  spacing = 'default',
  title,
  kicker,
  intro,
  action,
  decor,
  className,
  children,
}: {
  tone?: Tone
  spacing?: 'default' | 'tight'
  title?: string
  kicker?: string
  intro?: string
  action?: React.ReactNode
  decor?: 'arch'
  className?: string
  children: React.ReactNode
}) {
  const arch = decor === 'arch' && tone === 'deep'
  return (
    <section
      className={cn(
        toneClass[tone],
        spacing === 'default' ? 'py-section' : 'py-section-tight',
        arch && 'relative overflow-hidden',
        className
      )}
    >
      {arch && (
        <BridgeArch className="absolute -right-20 -bottom-8 hidden w-[600px] text-white/[0.07] md:block" />
      )}
      <Container className={cn(arch && 'relative')}>
        {(title || intro || action) && (
          <div className="mb-title-gap flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[68ch]">
              {kicker && (
                <p
                  className={cn(
                    'mb-2 text-sm font-medium',
                    tone === 'deep' ? 'text-stone' : 'text-river'
                  )}
                >
                  {kicker}
                </p>
              )}
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
