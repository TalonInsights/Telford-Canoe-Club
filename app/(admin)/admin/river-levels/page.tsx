import type { Metadata } from 'next'
import Link from 'next/link'

import { RiverBandsEditor } from '@/components/admin/river-bands-editor'
import { requireRole } from '@/lib/auth/guards'
import { getRiverBands } from '@/lib/queries/river-bands'
import { getRiverLevel } from '@/lib/river-level'

export const metadata: Metadata = { title: 'River levels' }

export default async function AdminRiverLevelsPage() {
  const [, bands, level] = await Promise.all([
    requireRole('committee'),
    getRiverBands(),
    getRiverLevel(),
  ])

  return (
    <>
      <div>
        <h1 className="text-2xl">River levels</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          What the gauge reading means, in the club&apos;s own words. These bands appear on the{' '}
          <Link href="/" className="underline underline-offset-2">
            home page
          </Link>{' '}
          and the{' '}
          <Link href="/venue/river-levels" className="underline underline-offset-2">
            river levels page
          </Link>
          , matched against the live Environment Agency reading at Buildwas.
        </p>
      </div>

      <div className="mt-6">
        <RiverBandsEditor bands={bands} currentMetres={level?.levelMetres ?? null} />
      </div>
    </>
  )
}
