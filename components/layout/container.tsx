import { cn } from '@/lib/utils'

/** §3.4 grid frame: 1200px max, 16px gutters under 768px, 24px above. */
export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 md:px-6', className)}>{children}</div>
  )
}
