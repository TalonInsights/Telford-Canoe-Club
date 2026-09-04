'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { cancelBookingAction } from '@/lib/actions/bookings'
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

export function CancelBookingButton({
  bookingId,
  label = 'Cancel',
  waitlist = false,
}: {
  bookingId: string
  label?: string
  waitlist?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{waitlist ? 'Leave the waitlist?' : 'Cancel your place?'}</DialogTitle>
          <DialogDescription>
            {waitlist
              ? 'You can confirm again later if there is still room.'
              : 'Your place goes back to the club — if there’s a waitlist, the next person moves up.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelBookingAction(bookingId)
                if (result.ok) {
                  toast.success(result.message ?? 'Cancelled')
                  setOpen(false)
                  router.refresh()
                } else toast.error(result.message)
              })
            }
          >
            {pending ? 'Cancelling…' : waitlist ? 'Leave the waitlist' : 'Cancel my place'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
