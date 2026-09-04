'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteEventAction, setEventStatusAction } from '@/lib/actions/events'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/** Draft → publish → cancel transitions plus delete, each audited (P5-02). */
export function EventStatusButtons({
  eventId,
  status,
  title,
  confirmed,
}: {
  eventId: string
  status: string
  title: string
  confirmed: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const setStatus = (next: 'draft' | 'published' | 'cancelled') =>
    startTransition(async () => {
      const result = await setEventStatusAction({ id: eventId, status: next })
      if (result.ok) {
        toast.success(result.message ?? 'Updated')
        setCancelOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const remove = () =>
    startTransition(async () => {
      const result = await deleteEventAction(eventId)
      if (result.ok) {
        toast.success(result.message ?? 'Deleted')
        router.push('/admin/events')
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' && (
        <Button variant="signal" size="sm" disabled={pending} onClick={() => setStatus('published')}>
          Publish
        </Button>
      )}
      {status === 'published' && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus('draft')}>
          Unpublish
        </Button>
      )}
      {status === 'cancelled' && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus('published')}>
          Reinstate
        </Button>
      )}

      {status === 'published' && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Cancel event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel &ldquo;{title}&rdquo;?</DialogTitle>
              <DialogDescription>
                The event stays on the site marked cancelled, and{' '}
                {confirmed === 0
                  ? 'nobody has confirmed yet.'
                  : `the ${confirmed} ${confirmed === 1 ? 'person' : 'people'} who confirmed will be emailed.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" disabled={pending} onClick={() => setStatus('cancelled')}>
                {pending ? 'Cancelling…' : 'Cancel event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{title}&rdquo; for good?</DialogTitle>
            <DialogDescription>
              This removes the event and its confirmations permanently. If it&apos;s simply not
              happening, cancel it instead — that keeps the record and tells people.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending ? 'Deleting…' : 'Delete event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
