import { Skeleton } from '@/components/ui/skeleton'

/** §3.5 rule 8 — skeletons that match the final layout, not spinners. */
export default function RootLoading() {
  return (
    <main className="mx-auto w-full max-w-[1200px] grow px-4 py-12 md:px-6">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="mt-4 h-5 w-full max-w-lg" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </main>
  )
}
