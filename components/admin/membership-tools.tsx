'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CalendarPlus, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { extendMembershipAction, markRefundedAction } from '@/lib/actions/membership'
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
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/** P4-07 — goodwill extension into the next membership year (£0, complimentary). */
export function ExtendMembershipButton({
  membershipId,
  memberName,
}: {
  membershipId: string
  memberName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus aria-hidden="true" /> Extend a year
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend {memberName} into the next membership year?</DialogTitle>
          <DialogDescription>
            Creates an active complimentary membership at £0 for the next period, covering the
            same people. Written to the audit log.
          </DialogDescription>
        </DialogHeader>
        <Field label="Why?" htmlFor="ext-note" optional>
          <Input
            id="ext-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. volunteer thank-you, agreed at the March meeting"
          />
        </Field>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await extendMembershipAction({ membershipId, note: note || undefined })
                if (result.ok) {
                  toast.success(result.message ?? 'Extended')
                  setOpen(false)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }
          >
            {pending ? 'Extending…' : 'Extend membership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** P4-07 — record that a payment was refunded (the money moves elsewhere). */
export function MarkRefundedButton({
  membershipId,
  memberName,
}: {
  membershipId: string
  memberName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Undo2 aria-hidden="true" /> Mark refunded
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {memberName}&apos;s membership refunded?</DialogTitle>
          <DialogDescription>
            Record-keeping only — issue the actual refund by bank transfer, in cash, or from the
            payment provider&apos;s dashboard first. The membership stops counting as active.
          </DialogDescription>
        </DialogHeader>
        <Field label="Where was the refund issued?" htmlFor="ref-note">
          <Input
            id="ref-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. refunded by bank transfer 3 Sep, ref 12345"
          />
        </Field>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || note.trim().length < 3}
            onClick={() =>
              startTransition(async () => {
                const result = await markRefundedAction({ membershipId, note })
                if (result.ok) {
                  toast.success(result.message ?? 'Marked refunded')
                  setOpen(false)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }
          >
            {pending ? 'Saving…' : 'Mark refunded'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
