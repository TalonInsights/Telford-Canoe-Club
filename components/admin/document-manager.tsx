'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ExternalLink, FileText, Lock, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import { deleteDocumentAction, saveDocumentAction } from '@/lib/actions/documents'
import type { DocumentWithLink } from '@/lib/queries/documents'
import { removeFromBucket, uploadToBucket } from '@/lib/storage/client-upload'
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_MAX_MB,
  committeeCategories,
  documentBucket,
  documentCategories,
  documentCategoryLabel,
  documentCategoryLabels,
  documentPath,
  formatFileSize,
  visibilityLabels,
  type DocumentCategory,
  type DocumentVisibility,
} from '@/lib/storage/documents'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field } from '@/components/ui/form-field'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/format'

/**
 * The club's document store, with the committee's own records first.
 *
 * Where a file goes is decided by who may see it: the visibility chosen here
 * picks the storage bucket, and the bucket policy is what actually stops a
 * member reaching a committee file. That is why visibility is chosen before
 * the file is uploaded rather than edited afterwards.
 */

const visibilityIcons: Record<DocumentVisibility, React.ComponentType<{ className?: string }>> = {
  committee: Lock,
  members: Users,
  public: ExternalLink,
}

type Filter = 'all' | DocumentVisibility

export function DocumentManager({
  documents,
  defaultVisibility = 'committee',
}: {
  documents: DocumentWithLink[]
  defaultVisibility?: DocumentVisibility
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<DocumentVisibility>(defaultVisibility)
  const [category, setCategory] = useState<DocumentCategory>('bookings')
  const [uploading, setUploading] = useState(false)

  const shown = documents.filter((d) => filter === 'all' || d.visibility === filter)
  const counts = {
    all: documents.length,
    committee: documents.filter((d) => d.visibility === 'committee').length,
    members: documents.filter((d) => d.visibility === 'members').length,
    public: documents.filter((d) => d.visibility === 'public').length,
  }

  function startAdding() {
    setDraftId(crypto.randomUUID())
    setTitle('')
    setVisibility(defaultVisibility)
    setCategory(defaultVisibility === 'committee' ? 'bookings' : 'policy')
    setOpen(true)
  }

  const remove = (doc: DocumentWithLink) =>
    startTransition(async () => {
      const result = await deleteDocumentAction(doc.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      // Tidy the file away too; the row is already gone either way.
      void removeFromBucket(documentBucket(doc.visibility), doc.storage_path).catch(() => undefined)
      toast.success(result.message ?? 'Removed')
      router.refresh()
    })

  const categoryOptions: DocumentCategory[] =
    visibility === 'committee' ? committeeCategories : [...documentCategories]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'committee', 'members', 'public'] as Filter[]).map((key) => (
          <Button
            key={key}
            variant={filter === key ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'Everything' : visibilityLabels[key]} ({counts[key]})
          </Button>
        ))}
        <Button className="ml-auto" onClick={startAdding}>
          <Plus aria-hidden="true" /> Add a document
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filter === 'all' ? 'Nothing filed yet' : 'Nothing in this drawer'}
          description="Add bookings, council contacts, the inventory, or anything else the committee needs to keep."
          action={<Button onClick={startAdding}>Add a document</Button>}
        />
      ) : (
        <ul className="grid gap-2">
          {shown.map((doc) => {
            const Icon = visibilityIcons[doc.visibility]
            return (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-stone bg-card p-4"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    doc.visibility === 'committee' ? 'bg-deep text-white' : 'bg-foam text-river'
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{doc.title}</span>
                    <Badge variant={doc.visibility === 'committee' ? 'warn' : 'default'}>
                      {visibilityLabels[doc.visibility]}
                    </Badge>
                    <span className="text-micro text-ink-muted">
                      {documentCategoryLabel(doc.category)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-micro text-ink-muted">
                    {doc.file_name}
                    {doc.size_bytes ? ` · ${formatFileSize(doc.size_bytes)}` : ''} ·{' '}
                    {formatDate(doc.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.href ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={doc.href} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    </Button>
                  ) : (
                    <span className="text-micro text-warn">File missing</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => remove(doc)}
                    aria-label={`Delete ${doc.title}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(v) => !uploading && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a document</DialogTitle>
            <DialogDescription>
              Choose who may see it before you upload: that decides which private store the file
              goes into, and it cannot be changed afterwards without uploading it again.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Field label="Title" htmlFor="doc-title" helper="What the committee will look for.">
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Jackfield site booking, October"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Who can see it" htmlFor="doc-visibility">
                <Select
                  value={visibility}
                  onValueChange={(v) => {
                    const next = v as DocumentVisibility
                    setVisibility(next)
                    setCategory(next === 'committee' ? 'bookings' : 'policy')
                  }}
                >
                  <SelectTrigger id="doc-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="committee">Committee only</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="public">Anyone</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Filed under" htmlFor="doc-category">
                <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                  <SelectTrigger id="doc-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {documentCategoryLabels[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {draftId && (
              <FileUpload
                accept={DOCUMENT_ACCEPT}
                maxSizeMb={DOCUMENT_MAX_MB}
                multiple={false}
                label={title.trim() ? 'Choose the file' : 'Give it a title first'}
                hint={`PDF, Word, Excel, CSV or text, up to ${DOCUMENT_MAX_MB}MB. It goes into the ${visibilityLabels[visibility].toLowerCase()} store.`}
                upload={async (file, onProgress) => {
                  if (!title.trim()) {
                    throw new Error('Give the document a title first')
                  }
                  setUploading(true)
                  try {
                    onProgress(20)
                    const path = await uploadToBucket(
                      documentBucket(visibility),
                      documentPath(draftId, file.name),
                      file,
                      { cacheControl: '0' }
                    )
                    onProgress(80)
                    const result = await saveDocumentAction({
                      id: draftId,
                      title: title.trim(),
                      category,
                      visibility,
                      storagePath: path,
                      fileName: file.name,
                      mimeType: file.type || 'application/octet-stream',
                      sizeBytes: file.size,
                      sortOrder: 0,
                    })
                    if (!result.ok) {
                      void removeFromBucket(documentBucket(visibility), path).catch(() => undefined)
                      throw new Error(result.message)
                    }
                    onProgress(100)
                    toast.success(result.message ?? 'Document added')
                    setOpen(false)
                    router.refresh()
                  } finally {
                    setUploading(false)
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
