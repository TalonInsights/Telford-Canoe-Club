'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Camera, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  deleteCommitteeRoleAction,
  setCommitteeRolePhotoAction,
  upsertCommitteeRoleAction,
} from '@/lib/actions/committee'
import { removeSiteImage, uploadSiteImage } from '@/lib/storage/client-upload'
import { committeePhotoPath, siteImageUrl } from '@/lib/storage/site-images'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/**
 * P9-09 — the roster the public committee page draws. One row per role: who
 * holds it, what it covers and (8 Sep 2026) the photo beside the name. Photos
 * go straight from the browser to `site-images/committee/{role}/...`
 * (lib/storage/client-upload.ts); the row records the path and the previous
 * file is tidied away best-effort once the new one is saved.
 */

type RoleRow = {
  id: string
  role_title: string
  holder_display_name: string | null
  contact_email: string | null
  description: string | null
  sort_order: number
  photo_path: string | null
}

type Draft = {
  id?: string
  roleTitle: string
  holderDisplayName: string
  contactEmail: string
  description: string
  sortOrder: number
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_MAX_MB = 8

const emptyDraft = (nextOrder: number): Draft => ({
  roleTitle: '',
  holderDisplayName: '',
  contactEmail: '',
  description: '',
  sortOrder: nextOrder,
})

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** The picture beside a name: the photo, or initials until one is added. */
function RoleThumb({ row, busy }: { row: RoleRow; busy: boolean }) {
  const url = siteImageUrl(row.photo_path)
  const vacant = !row.holder_display_name
  return (
    <div
      className={cn(
        'relative size-16 shrink-0 overflow-hidden rounded-lg',
        vacant ? 'bg-foam text-ink-muted' : 'bg-river text-white'
      )}
    >
      {url ? (
        <Image src={url} alt="" fill unoptimized sizes="64px" className="object-cover" />
      ) : (
        <span
          className="flex size-full items-center justify-center font-heading text-lg"
          aria-hidden="true"
        >
          {vacant ? '?' : initials(row.holder_display_name as string)}
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-deep/60 text-white">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        </span>
      )}
    </div>
  )
}

function RoleCard({
  row,
  pending,
  onEdit,
  onDelete,
}: {
  row: RoleRow
  pending: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function changePhoto(file: File) {
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error('Use a JPG, PNG or WebP picture')
      return
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      toast.error(`That picture is too large, the limit is ${PHOTO_MAX_MB}MB`)
      return
    }
    setBusy(true)
    try {
      const path = await uploadSiteImage(committeePhotoPath(row.id, file.name), file)
      const result = await setCommitteeRolePhotoAction({ id: row.id, photoPath: path })
      if (!result.ok) {
        void removeSiteImage(path).catch(() => undefined)
        toast.error(result.message)
        return
      }
      if (row.photo_path) void removeSiteImage(row.photo_path).catch(() => undefined)
      toast.success(result.message ?? 'Photo saved')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The upload failed, try again')
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    const previous = row.photo_path
    if (!previous) return
    setBusy(true)
    try {
      const result = await setCommitteeRolePhotoAction({ id: row.id, photoPath: null })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      void removeSiteImage(previous).catch(() => undefined)
      toast.success(result.message ?? 'Photo removed')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That did not save, try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-stone bg-card p-4">
      <div className="flex gap-4">
        <RoleThumb row={row} busy={busy} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{row.role_title}</span>
            {row.holder_display_name ? (
              <span className="text-sm text-ink-muted">{row.holder_display_name}</span>
            ) : (
              <Badge variant="warn">Vacant</Badge>
            )}
          </div>
          {row.description && (
            <p className="mt-1 max-w-[60ch] text-micro text-ink-muted">{row.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void changePhoto(file)
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Camera aria-hidden="true" /> {row.photo_path ? 'Change photo' : 'Add photo'}
            </Button>
            {row.photo_path && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => void removePhoto()}>
                Remove photo
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil aria-hidden="true" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onDelete}
              aria-label={`Remove ${row.role_title}`}
            >
              <Trash2 aria-hidden="true" />
            </Button>
            <span className="ml-auto text-micro tabular-nums text-ink-muted">
              #{row.sort_order}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

export function CommitteeEditor({ roles }: { roles: RoleRow[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      if (!draft) return
      const result = await upsertCommitteeRoleAction({
        id: draft.id,
        roleTitle: draft.roleTitle,
        holderDisplayName: draft.holderDisplayName || undefined,
        contactEmail: draft.contactEmail || undefined,
        description: draft.description || undefined,
        sortOrder: draft.sortOrder,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        setDraft(null)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = (row: RoleRow) =>
    startTransition(async () => {
      const result = await deleteCommitteeRoleAction(row.id)
      if (result.ok) {
        toast.success(`${row.role_title} removed`)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-3">
      <ul className="grid gap-3">
        {roles.map((row) => (
          <RoleCard
            key={row.id}
            row={row}
            pending={pending}
            onDelete={() => remove(row)}
            onEdit={() =>
              setDraft({
                id: row.id,
                roleTitle: row.role_title,
                holderDisplayName: row.holder_display_name ?? '',
                contactEmail: row.contact_email ?? '',
                description: row.description ?? '',
                sortOrder: row.sort_order,
              })
            }
          />
        ))}
      </ul>

      <div>
        <Button
          variant="secondary"
          onClick={() => setDraft(emptyDraft((roles.at(-1)?.sort_order ?? 0) + 1))}
        >
          <Plus aria-hidden="true" /> Add a role
        </Button>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? `Edit ${draft.roleTitle || 'role'}` : 'Add a role'}</DialogTitle>
            <DialogDescription>
              Changes go live on the public committee page immediately.
              {!draft?.id && ' Save the role first, then add a photo from the list.'}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <Field label="Role title" htmlFor="cr-title">
                <Input
                  id="cr-title"
                  value={draft.roleTitle}
                  onChange={(e) => setDraft({ ...draft, roleTitle: e.target.value })}
                />
              </Field>
              <Field
                label="Holder"
                htmlFor="cr-holder"
                optional
                helper="Leave blank to mark the role vacant."
              >
                <Input
                  id="cr-holder"
                  value={draft.holderDisplayName}
                  onChange={(e) => setDraft({ ...draft, holderDisplayName: e.target.value })}
                />
              </Field>
              <Field label="Contact email" htmlFor="cr-email" optional>
                <Input
                  id="cr-email"
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                />
              </Field>
              <Field label="What the role covers" htmlFor="cr-desc" optional>
                <Textarea
                  id="cr-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <Field label="Sort order" htmlFor="cr-order" helper="Lower numbers appear first.">
                <Input
                  id="cr-order"
                  inputMode="numeric"
                  value={String(draft.sortOrder)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sortOrder: Number(e.target.value.replace(/\D/g, '')) || 0,
                    })
                  }
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button disabled={pending || !draft?.roleTitle.trim()} onClick={save}>
              {pending ? 'Saving…' : 'Save role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
