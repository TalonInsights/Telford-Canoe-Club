'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { recordPaymentAction } from '@/lib/actions/membership'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMoneyGBP } from '@/lib/format'

export function RecordPaymentButton({
  membershipId,
  memberName,
  amountPence,
}: {
  membershipId: string
  memberName: string
  amountPence: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<'manual_bank' | 'manual_cash' | 'complimentary'>('manual_bank')
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Record payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Record {formatMoneyGBP(amountPence)} from {memberName}?
          </DialogTitle>
          <DialogDescription>
            This activates the membership immediately and is written to the audit log.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="How did the money arrive?" htmlFor="rp-source">
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger id="rp-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_bank">Bank transfer</SelectItem>
                <SelectItem value="manual_cash">Cash</SelectItem>
                <SelectItem value="complimentary">Complimentary — no payment</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reference or note" htmlFor="rp-note" optional>
            <Input
              id="rp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. bank ref, who took the cash"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await recordPaymentAction({ membershipId, source, note })
                if (result.ok) {
                  toast.success(result.message ?? 'Payment recorded')
                  setOpen(false)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }
          >
            {pending ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
