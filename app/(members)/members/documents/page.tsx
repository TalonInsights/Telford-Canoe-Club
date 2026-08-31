import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

import { requireCurrentMember } from '@/lib/auth/guards'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DocumentList } from '@/components/site/document-list'

export const metadata: Metadata = { title: 'Members documents' }

export default async function MemberDocumentsPage() {
  await requireCurrentMember()

  const documents: { title: string; href: string; note?: string }[] = []
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('documents')
      .select('id, title, category, storage_path, version_label')
      .order('sort_order')
    for (const doc of data ?? []) {
      const { data: signed } = await supabase.storage
        .from('documents-members')
        .createSignedUrl(doc.storage_path, 3600)
      if (signed?.signedUrl) {
        documents.push({
          title: doc.title,
          href: signed.signedUrl,
          note: [doc.category, doc.version_label].filter(Boolean).join(' · '),
        })
      }
    }
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nothing in the library yet"
        description="Minutes, AGM papers and members-only documents appear here as the committee uploads them."
        action={
          <Button asChild variant="secondary">
            <Link href="/about/policies">Public policies</Link>
          </Button>
        }
      />
    )
  }

  return <DocumentList documents={documents} />
}
