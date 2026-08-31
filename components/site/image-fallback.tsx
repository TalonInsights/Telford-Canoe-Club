import { cn } from '@/lib/utils'

/**
 * §3.4 missing-image rule: a tinted deep block with the white paddle-blade
 * glyph at 20% opacity. Always fills its box, so grids stay even whether or
 * not a photo exists. The SVG is inline so tokens can recolour it (§2.5).
 */
export function PaddleGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn('size-12', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M14.5 33.5 33.5 14.5" />
      <path
        d="M34 15c4.5-4.5 7.5-9.5 6-11s-6.5 1.5-11 6c-2 2-2.5 4.5-1 6s4 1 6-1Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M14 33c-4.5 4.5-7.5 9.5-6 11s6.5-1.5 11-6c2-2 2.5-4.5 1-6s-4-1-6 1Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-full w-full items-center justify-center bg-deep', className)}
      role="presentation"
    >
      <PaddleGlyph className="size-16 text-white opacity-20" />
    </div>
  )
}
