'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cancelMembershipAction } from '@/lib/actions/membership'
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

export function CancelMembershipButton({
  membershipId,
  memberName,
}: {
  membershipId: string
  memberName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Cancel membership
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {memberName}&apos;s membership?</DialogTitle>
          <DialogDescription>
            This removes their current cover. The reason is kept on the record and in the audit
            log.
          </DialogDescription>
        </DialogHeader>
        <Field label="Reason" htmlFor="cm-reason">
          <Input
            id="cm-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. refunded outside the site, duplicate request"
          />
        </Field>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || reason.trim().length < 3}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelMembershipAction({ membershipId, reason })
                if (result.ok) {
                  toast.success(result.message ?? 'Cancelled')
                  setOpen(false)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }
          >
            {pending ? 'Cancelling…' : 'Cancel membership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
