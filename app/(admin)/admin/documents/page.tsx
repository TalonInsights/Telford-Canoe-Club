import type { Metadata } from 'next'
import { Lock } from 'lucide-react'

import { DocumentManager } from '@/components/admin/document-manager'
import { getDocuments } from '@/lib/queries/documents'

export const metadata: Metadata = { title: 'Documents' }

export default async function AdminDocumentsPage() {
  const documents = await getDocuments()

  return (
    <>
      <div>
        <h1 className="text-2xl">Documents</h1>
        <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
          The club&apos;s filing cabinet: the committee&apos;s own records, the members&apos;
          library, and anything published for the public.
        </p>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-stone bg-card p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-deep text-white">
          <Lock aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-lg">How committee-only works</h2>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            Anything marked committee only is kept in a separate private store that only committee
            and admin accounts can open, even with a direct link. Members cannot reach it, and
            neither can anyone who is not signed in. Bookings, council contacts and the inventory
            belong here.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <DocumentManager documents={documents} defaultVisibility="committee" />
      </div>
    </>
  )
}
