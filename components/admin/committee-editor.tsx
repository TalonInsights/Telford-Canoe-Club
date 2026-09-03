'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  deleteCommitteeRoleAction,
  upsertCommitteeRoleAction,
} from '@/lib/actions/committee'
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

type RoleRow = {
  id: string
  role_title: string
  holder_display_name: string | null
  contact_email: string | null
  description: string | null
  sort_order: number
}

type Draft = {
  id?: string
  roleTitle: string
  holderDisplayName: string
  contactEmail: string
  description: string
  sortOrder: number
}

const emptyDraft = (nextOrder: number): Draft => ({
  roleTitle: '',
  holderDisplayName: '',
  contactEmail: '',
  description: '',
  sortOrder: nextOrder,
})

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
      {roles.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone bg-card p-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
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
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-micro tabular-nums text-ink-muted">#{row.sort_order}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDraft({
                  id: row.id,
                  roleTitle: row.role_title,
                  holderDisplayName: row.holder_display_name ?? '',
                  contactEmail: row.contact_email ?? '',
                  description: row.description ?? '',
                  sortOrder: row.sort_order,
                })
              }
            >
              <Pencil aria-hidden="true" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => remove(row)}
              aria-label={`Remove ${row.role_title}`}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

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
              <Field label="Holder" htmlFor="cr-holder" optional helper="Leave blank to mark the role vacant.">
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
                    setDraft({ ...draft, sortOrder: Number(e.target.value.replace(/\D/g, '')) || 0 })
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
