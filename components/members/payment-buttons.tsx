'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { abandonOnlineOrderAction, payPendingOnlineAction } from '@/lib/actions/payments'

/** "Pay online instead" on a pending (treasurer-path) membership. */
export function PayOnlineButton({
  membershipId,
  amountLabel,
}: {
  membershipId: string
  amountLabel: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="signal"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await payPendingOnlineAction(membershipId)
          if (result.ok) router.push(result.redirect)
          else toast.error(result.message)
        })
      }
    >
      <Zap aria-hidden="true" />
      {pending ? 'Opening checkout…' : `Pay ${amountLabel} online now`}
    </Button>
  )
}

/** "Switch to bank transfer" on a started-but-unfinished online payment. */
export function AbandonOrderButton({ orderRef }: { orderRef: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await abandonOnlineOrderAction(orderRef)
          if (result.ok) {
            toast.success('Switched to the treasurer route')
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }
    >
      {pending ? 'Switching…' : 'Switch to bank transfer instead'}
    </Button>
  )
}
