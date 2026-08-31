import { Children } from 'react'

import { balancedColumns } from '@/lib/layout/balanced-columns'
import { cn } from '@/lib/utils'

/**
 * §3.4 section shape 1 — Full-grid. Equal-height rows, and the orphan rule
 * applied at both the 2-col (sm) and max-col (lg) breakpoints, so the last
 * row is never visibly short at any width. Track/span numbers come from
 * balancedColumns and are applied through CSS variables (.tcc-fullgrid in
 * globals.css); items that fall in a short last row get a wider span inline.
 */
export function FullGrid({
  maxColumns = 3,
  className,
  children,
}: {
  maxColumns?: 2 | 3 | 4
  className?: string
  children: React.ReactNode
}) {
  const items = Children.toArray(children)
  const n = items.length
  const lg = balancedColumns(n, maxColumns)
  const sm = balancedColumns(n, 2)

  const gridVars = {
    '--g-tracks-sm': sm.tracks,
    '--g-span-sm': sm.itemSpan,
    '--g-tracks-lg': lg.tracks,
    '--g-span-lg': lg.itemSpan,
  } as React.CSSProperties

  return (
    <div className={cn('tcc-fullgrid', className)} style={gridVars}>
      {items.map((child, i) => {
        const inLastSm = sm.remainder > 0 && i >= n - sm.remainder
        const inLastLg = lg.remainder > 0 && i >= n - lg.remainder
        const itemVars = {
          ...(inLastSm ? { '--gi-sm': sm.lastRowSpan } : {}),
          ...(inLastLg ? { '--gi-lg': lg.lastRowSpan } : {}),
        } as React.CSSProperties
        return (
          <div key={i} className="min-w-0" style={itemVars}>
            {child}
          </div>
        )
      })}
    </div>
  )
}

/**
 * §3.4 section shape 2 — Split 7/5. Text spans 7 of 12 (58%), media 5.
 * `side` is which side the MEDIA sits on at desktop; alternate it section to
 * section. Text carries an inner 68ch measure (audit rule ⑤ — the raw 7-col
 * cell is 690px, wider than 68ch). Media fills the cell height, text centres.
 */
export function Split75({
  side = 'right',
  media,
  className,
  children,
}: {
  side?: 'left' | 'right'
  media: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('grid grid-cols-1 items-center gap-6 lg:grid-cols-12', className)}>
      <div
        className={cn('flex flex-col justify-center lg:col-span-7', side === 'left' && 'lg:order-2')}
      >
        <div className="max-w-[68ch]">{children}</div>
      </div>
      <div className={cn('relative min-h-full lg:col-span-5', side === 'left' && 'lg:order-1')}>
        <div className="relative aspect-[4/3] h-full w-full overflow-hidden rounded-xl lg:aspect-auto lg:min-h-[320px]">
          {media}
        </div>
      </div>
    </div>
  )
}

/** §3.4 section shape 3 — Centred column, 720px, for prose-only content. */
export function CentredColumn({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('mx-auto w-full max-w-[720px]', className)}>{children}</div>
}
