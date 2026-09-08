import { randomUUID } from 'node:crypto'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { MinutesEditor } from '@/components/admin/minutes-editor'

export const metadata: Metadata = { title: 'New minutes' }

export default function NewMinutesPage() {
  // Minted here so an attachment can be filed under the right record before
  // the record itself exists, the same trick the event form uses for covers.
  const id = randomUUID()

  return (
    <>
      <Link
        href="/admin/minutes"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All minutes
      </Link>
      <h1 className="mt-2 text-2xl">Write up a meeting</h1>
      <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
        The club&apos;s usual running order is filled in for you. Publish when the committee is
        happy, and every current member can read them.
      </p>
      <div className="mt-6">
        <MinutesEditor minutesId={id} mode="create" />
      </div>
    </>
  )
}
