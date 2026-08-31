import { FileText, Download } from 'lucide-react'

/**
 * Shared list treatment for policy and role-description documents. Until the
 * Phase 6 document library takes over, files link to their current hosting
 * on the club's existing site so nothing is lost in the move.
 */

export type DocumentLink = {
  title: string
  href: string
  note?: string
}

export function DocumentList({ documents }: { documents: DocumentLink[] }) {
  return (
    <ul className="divide-y divide-stone overflow-hidden rounded-xl border border-stone bg-card">
      {documents.map((doc) => (
        <li key={doc.href}>
          <a
            href={doc.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-foam"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foam">
              <FileText aria-hidden="true" className="size-4 text-river" />
            </span>
            <span className="min-w-0 grow">
              <span className="block font-medium">{doc.title}</span>
              {doc.note && <span className="block text-micro text-ink-muted">{doc.note}</span>}
            </span>
            <Download aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
          </a>
        </li>
      ))}
    </ul>
  )
}
