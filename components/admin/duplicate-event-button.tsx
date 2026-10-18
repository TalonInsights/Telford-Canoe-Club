'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { duplicateEventAction } from '@/lib/actions/events'
import { Button } from '@/components/ui/button'

/**
 * Copy this event into a new draft and open it, so the committee can run the
 * same session on a new date without retyping it (6.2).
 */
export function DuplicateEventButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const duplicate = () =>
    startTransition(async () => {
      const result = await duplicateEventAction(eventId)
      if (result.ok && result.id) {
        toast.success(result.message ?? 'Duplicated')
        router.push(`/admin/events/${result.id}`)
      } else {
        toast.error(result.ok ? 'Could not open the copy' : result.message)
      }
    })

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={duplicate}>
      <Copy aria-hidden="true" /> {pending ? 'Copying…' : 'Duplicate'}
    </Button>
  )
}
