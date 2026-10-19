import type { Metadata } from 'next'

import { PlacesEditor } from '@/components/admin/places-editor'
import { requireRole } from '@/lib/auth/guards'
import { getAllPlaces } from '@/lib/queries/paddle-places'

export const metadata: Metadata = { title: 'Where we paddle' }

export default async function AdminPlacesPage() {
  const [, places] = await Promise.all([requireRole('committee'), getAllPlaces()])

  return (
    <>
      <div>
        <h1 className="text-2xl">Where we paddle</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          The places the club paddles, shown on the paddlesports page grouped into artificial
          courses and natural rivers. Reorder with the arrows; anything not shown stays hidden
          from the public.
        </p>
      </div>
      <div className="mt-6">
        <PlacesEditor initial={places} />
      </div>
    </>
  )
}
