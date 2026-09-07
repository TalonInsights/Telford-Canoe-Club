import { Skeleton } from '@/components/ui/skeleton'

/**
 * §3.5 rule 8 — the members area swaps tabs against a live database, so the
 * page slot shows its own shape instantly while the server answers. The shell
 * (greeting + tabs) stays put; only this area swaps.
 */
export default function MembersLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-xl border border-stone bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-14" />
          </div>
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
