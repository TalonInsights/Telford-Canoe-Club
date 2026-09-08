'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deleteMinutesAction, setMinutesStatusAction } from '@/lib/actions/minutes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Publish, unpublish or delete a set of minutes, with the delete behind a check. */
export function MinutesStatusButtons({
  id,
  status,
  title,
}: {
  id: string
  status: string
  title: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const setStatus = (next: 'draft' | 'published') =>
    startTransition(async () => {
      const result = await setMinutesStatusAction({ id, status: next })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = () =>
    startTransition(async () => {
      const result = await deleteMinutesAction(id)
      if (result.ok) {
        toast.success(result.message ?? 'Deleted')
        setConfirming(false)
        router.push('/admin/minutes')
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'published' ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus('draft')}>
          <EyeOff aria-hidden="true" /> Unpublish
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => setStatus('published')}>
          <Eye aria-hidden="true" /> Publish to members
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" /> Delete
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete these minutes?</DialogTitle>
            <DialogDescription>
              {title} will be removed for good. If you only want to take them away from members,
              unpublish instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep them
            </Button>
            <Button variant="signal" disabled={pending} onClick={remove}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
