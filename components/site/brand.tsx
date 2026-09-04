import { useId } from 'react'

import { cn } from '@/lib/utils'

/**
 * DR-01 — the club mark, drawn from the badge Simon supplied: a ring, the
 * Iron Bridge deck and lattice arch, a paddler on the rapid, water beneath.
 * Everything is `currentColor` so the tokens recolour it (white on deep, ink
 * on foam). `detailed` adds the ring lettering and the arch lattice — use it
 * at 96px and up; the plain variant stays legible down to 32px.
 *
 * When the club's raster artwork arrives it goes in `public/brand/` and this
 * component is the one place to swap it in.
 */
export function ClubBadge({
  className,
  detailed = false,
  title,
}: {
  className?: string
  detailed?: boolean
  /** Give the mark a name when it is the only content of a link. */
  title?: string
}) {
  const id = useId()
  const clipId = `${id}-scene`
  const topArcId = `${id}-top`
  const bottomArcId = `${id}-bottom`

  // Radial lattice between the two arches (centre 50,68 · radii 26 and 33).
  const spokes = detailed
    ? Array.from({ length: 11 }, (_, i) => {
        const angle = ((15 + i * 15) * Math.PI) / 180
        const x1 = 50 + 26 * Math.cos(angle)
        const y1 = 68 - 26 * Math.sin(angle)
        const x2 = 50 + 33 * Math.cos(angle)
        const y2 = 68 - 33 * Math.sin(angle)
        return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`
      }).join(' ')
    : ''

  return (
    <svg
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      className={cn('size-10 shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r={detailed ? 36 : 43.5} />
        </clipPath>
        {detailed && (
          <>
            <path id={topArcId} d="M 8.5 50 A 41.5 41.5 0 0 1 91.5 50" />
            <path id={bottomArcId} d="M 8.5 50 A 41.5 41.5 0 0 0 91.5 50" />
          </>
        )}
      </defs>

      {/* Ring */}
      <circle cx="50" cy="50" r="47.5" strokeWidth={detailed ? 2.6 : 3.5} />
      {detailed && <circle cx="50" cy="50" r="37" strokeWidth="1" />}

      {detailed && (
        <g
          fill="currentColor"
          stroke="none"
          fontWeight="700"
          fontSize="8.2"
          letterSpacing="1.6"
          style={{ fontFamily: 'var(--font-bricolage), var(--font-figtree), system-ui, sans-serif' }}
        >
          <text dy="3">
            <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
              TELFORD
            </textPath>
          </text>
          <text dy="3">
            <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
              CANOE CLUB
            </textPath>
          </text>
        </g>
      )}

      {/* Scene — scaled into the inner disc when the lettering needs the band */}
      <g
        clipPath={`url(#${clipId})`}
        transform={detailed ? 'translate(50 50) scale(0.8) translate(-50 -50)' : undefined}
      >
        {/* Bridge deck and railing */}
        <path d="M2 34 H98" strokeWidth="2.4" />
        <path d="M2 29.5 H98" strokeWidth="1.1" />
        {detailed && (
          <path
            d="M14 29.5 V34 M22 29.5 V34 M30 29.5 V34 M38 29.5 V34 M46 29.5 V34 M54 29.5 V34 M62 29.5 V34 M70 29.5 V34 M78 29.5 V34 M86 29.5 V34"
            strokeWidth="0.9"
          />
        )}
        {/* The arch — outer and inner ribs, lattice between */}
        <path d="M17 68 A33 33 0 0 1 83 68" strokeWidth="2.4" />
        <path d="M24 68 A26 26 0 0 1 76 68" strokeWidth="1.4" />
        {spokes && <path d={spokes} strokeWidth="0.9" />}
        {/* Piers */}
        <path d="M17 68 V80 M83 68 V80" strokeWidth="2.4" />
        {/* Water */}
        <path
          d="M0 82 c5 -2.6 10 -2.6 15 0 s10 2.6 15 0 10 -2.6 15 0 10 2.6 15 0 10 -2.6 15 0 10 2.6 15 0 10 -2.6 15 0"
          strokeWidth="1.5"
        />
        <path
          d="M0 89 c5 -2.6 10 -2.6 15 0 s10 2.6 15 0 10 -2.6 15 0 10 2.6 15 0 10 -2.6 15 0 10 2.6 15 0 10 -2.6 15 0"
          strokeWidth="1.5"
          opacity="0.7"
        />
        {/* Paddler — a solid silhouette so it reads at any size */}
        <g fill="currentColor" stroke="none">
          <path d="M20 77 Q50 68 84 71.5 Q52 83 20 77 Z" />
          <path d="M45.5 58.5 h9 a3 3 0 0 1 3 3 v11 h-15 v-11 a3 3 0 0 1 3 -3 Z" />
          <circle cx="50" cy="51.5" r="4.6" />
          <ellipse cx="29" cy="73" rx="5.2" ry="2.5" transform="rotate(-34 29 73)" />
          <ellipse cx="71" cy="44.5" rx="5.2" ry="2.5" transform="rotate(-34 71 44.5)" />
        </g>
        <path d="M32 71 L68 46.5" strokeWidth="2.6" />
        <path d="M47 62 L41 65.5 M54 61.5 L61 51.5" strokeWidth="2.4" />
      </g>
    </svg>
  )
}

/**
 * The Iron Bridge as a wide line drawing for deep backgrounds — set the
 * colour with a text utility (e.g. `text-white/10`). Decorative only: always
 * `aria-hidden`, always behind content, hidden on narrow screens by the caller.
 */
export function BridgeArch({ className }: { className?: string }) {
  const spokes = Array.from({ length: 17 }, (_, i) => {
    const angle = ((10 + i * 10) * Math.PI) / 180
    const x1 = 320 + 196 * Math.cos(angle)
    const y1 = 240 - 196 * Math.sin(angle)
    const x2 = 320 + 230 * Math.cos(angle)
    const y2 = 240 - 230 * Math.sin(angle)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`
  }).join(' ')
  const posts = Array.from({ length: 21 }, (_, i) => `M${i * 32} 26 V40`).join(' ')

  return (
    <svg
      viewBox="0 0 640 240"
      aria-hidden="true"
      className={cn('pointer-events-none select-none', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <path d="M0 40 H640" strokeWidth="2.5" />
      <path d="M0 26 H640" strokeWidth="1.2" />
      <path d={posts} strokeWidth="1" />
      <path d="M90 240 A230 230 0 0 1 550 240" strokeWidth="2.5" />
      <path d="M124 240 A196 196 0 0 1 516 240" strokeWidth="1.4" />
      <path d={spokes} strokeWidth="1" />
      <path
        d="M0 214 c10 -5 20 -5 30 0 s20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0"
        strokeWidth="1.4"
      />
      <path
        d="M0 230 c10 -5 20 -5 30 0 s20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0 20 5 30 0 20 -5 30 0"
        strokeWidth="1.4"
        opacity="0.7"
      />
    </svg>
  )
}

/** Name + tagline lock-up used beside the badge in the header, footer and rail. */
export function Wordmark({
  className,
  tagline = 'Jackfield Rapids · Ironbridge',
  size = 'md',
}: {
  className?: string
  tagline?: string | null
  size?: 'sm' | 'md'
}) {
  return (
    <span className={cn('flex min-w-0 flex-col leading-none', className)}>
      <span
        className={cn(
          'font-heading font-semibold tracking-tight',
          size === 'md' ? 'text-[17px]' : 'text-base'
        )}
      >
        Telford Canoe Club
      </span>
      {tagline && <span className="mt-1 text-micro text-stone/85">{tagline}</span>}
    </span>
  )
}
