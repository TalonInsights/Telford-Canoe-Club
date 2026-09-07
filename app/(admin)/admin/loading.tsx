import { Skeleton } from '@/components/ui/skeleton'

/** Admin page slot skeleton — title, a row of stat cards, a table block (§3.5 rule 8). */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-8 h-64" />
    </div>
  )
}
