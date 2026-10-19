'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { addFamilyMemberAction } from '@/lib/actions/family'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * Add a child or other family member to a family membership — the case Simon
 * raised of a parent who adds one child at sign-up and forgets the second.
 * The form is collapsed until asked for, so it never clutters the common view.
 */
export function AddFamilyMember({ membershipId }: { membershipId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [v, setV] = useState({ name: '', dateOfBirth: '', emergencyName: '', emergencyPhone: '' })

  const add = () =>
    startTransition(async () => {
      const result = await addFamilyMemberAction({ membershipId, ...v })
      if (result.ok) {
        toast.success(result.message ?? 'Added')
        setV({ name: '', dateOfBirth: '', emergencyName: '', emergencyPhone: '' })
        setOpen(false)
        router.refresh()
      } else toast.error(result.message)
    })

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden="true" /> Add a child or family member
      </Button>
    )
  }

  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-stone bg-card p-4">
      <p className="text-sm font-medium">Add someone to this membership</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="fm-name">
          <Input id="fm-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Date of birth" htmlFor="fm-dob" optional helper="Tells us if they are a junior.">
          <Input id="fm-dob" type="date" value={v.dateOfBirth} onChange={(e) => setV({ ...v, dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Emergency contact name" htmlFor="fm-ecn" optional>
          <Input id="fm-ecn" value={v.emergencyName} onChange={(e) => setV({ ...v, emergencyName: e.target.value })} />
        </Field>
        <Field label="Emergency contact phone" htmlFor="fm-ecp" optional>
          <Input id="fm-ecp" type="tel" value={v.emergencyPhone} onChange={(e) => setV({ ...v, emergencyPhone: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || v.name.trim().length < 2} onClick={add}>
          {pending ? 'Adding…' : 'Add to my membership'}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
