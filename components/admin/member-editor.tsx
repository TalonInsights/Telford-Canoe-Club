'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { updateMemberProfileAction } from '@/lib/actions/profile'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * The committee correcting somebody's record.
 *
 * It opens as the record rather than as a form, because reading one is the
 * common case and twelve input boxes is a worse way to read anything. Every
 * save is logged by the database trigger, named as a committee edit rather
 * than the member's own, so the two are told apart in the change log.
 */

export type MemberValues = {
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  addressLine1: string
  addressLine2: string
  town: string
  postcode: string
  bcNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  guardianName: string
  guardianPhone: string
  emailOptIn: boolean
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-stone py-2 text-sm last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{value || 'Not recorded'}</dd>
    </div>
  )
}

export function MemberEditor({
  userId,
  email,
  role,
  initial,
}: {
  userId: string
  email: string
  role: string
  initial: MemberValues
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState(initial)
  const [pending, startTransition] = useTransition()

  const set =
    (k: keyof MemberValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }))

  const cancel = () => {
    setValues(initial)
    setEditing(false)
  }

  const save = () =>
    startTransition(async () => {
      const result = await updateMemberProfileAction({ userId, ...values })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        setEditing(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  if (!editing) {
    return (
      <section className="rounded-xl border border-stone bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg">Profile</h2>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" /> Edit details
          </Button>
        </div>
        <dl className="mt-3">
          <Row label="Phone" value={initial.phone} />
          <Row
            label="Address"
            value={[initial.addressLine1, initial.addressLine2, initial.town, initial.postcode]
              .filter(Boolean)
              .join(', ')}
          />
          <Row
            label="Date of birth"
            value={initial.dateOfBirth ? formatDate(initial.dateOfBirth) : null}
          />
          <Row label="Paddle UK number" value={initial.bcNumber} />
          <Row
            label="Emergency contact"
            value={[initial.emergencyContactName, initial.emergencyContactPhone]
              .filter(Boolean)
              .join(' · ')}
          />
          <Row
            label="Parent or guardian"
            value={[initial.guardianName, initial.guardianPhone].filter(Boolean).join(' · ')}
          />
          <Row label="Site role" value={role} />
          <Row label="Club news emails" value={initial.emailOptIn ? 'Opted in' : 'Opted out'} />
        </dl>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-river bg-card p-5">
      <h2 className="text-lg">Editing this record</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Saved changes are recorded in the change log against your name. The email address is not
        edited here — it is what they log in with.
      </p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="me-first">
            <Input id="me-first" value={values.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name" htmlFor="me-last">
            <Input id="me-last" value={values.lastName} onChange={set('lastName')} />
          </Field>
        </div>

        <Field
          label="Date of birth"
          htmlFor="me-dob"
          helper="Decides junior status, so only the committee can change it."
        >
          <Input
            id="me-dob"
            type="date"
            className="max-w-52"
            value={values.dateOfBirth}
            onChange={set('dateOfBirth')}
          />
        </Field>

        <Field label="Phone" htmlFor="me-phone">
          <Input id="me-phone" type="tel" value={values.phone} onChange={set('phone')} />
        </Field>
        <Field label="Address line 1" htmlFor="me-a1">
          <Input id="me-a1" value={values.addressLine1} onChange={set('addressLine1')} />
        </Field>
        <Field label="Address line 2" htmlFor="me-a2" optional>
          <Input id="me-a2" value={values.addressLine2} onChange={set('addressLine2')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town" htmlFor="me-town">
            <Input id="me-town" value={values.town} onChange={set('town')} />
          </Field>
          <Field label="Postcode" htmlFor="me-pc" helper="Like TF8 7HJ">
            <Input id="me-pc" className="max-w-40" value={values.postcode} onChange={set('postcode')} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emergency contact name" htmlFor="me-ecn" optional>
            <Input id="me-ecn" value={values.emergencyContactName} onChange={set('emergencyContactName')} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="me-ecp" optional>
            <Input id="me-ecp" type="tel" value={values.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parent or guardian name" htmlFor="me-gn" helper="Required for under-18s." optional>
            <Input id="me-gn" value={values.guardianName} onChange={set('guardianName')} />
          </Field>
          <Field label="Parent or guardian phone" htmlFor="me-gp" optional>
            <Input id="me-gp" type="tel" value={values.guardianPhone} onChange={set('guardianPhone')} />
          </Field>
        </div>

        <Field label="Paddle UK membership number" htmlFor="me-bc" optional>
          <Input id="me-bc" value={values.bcNumber} onChange={set('bcNumber')} />
        </Field>

        <div>
          <label className="flex min-h-11 items-center gap-2.5 text-sm">
            <Checkbox
              checked={values.emailOptIn}
              disabled={!initial.emailOptIn}
              onCheckedChange={(v) => setValues((s) => ({ ...s, emailOptIn: !!v }))}
            />
            Send them club news
          </label>
          <p className="text-micro text-ink-muted">
            {initial.emailOptIn
              ? 'You can turn this off if they ask. Only they can turn it back on, from their own profile.'
              : 'They have opted out of club news. Only they can opt back in, from their own profile.'}
          </p>
        </div>

        <p className="text-micro text-ink-muted">
          Signing in as {email}. Internal and medical notes are not edited from this screen.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save the record'}
        </Button>
        <Button variant="outline" disabled={pending} onClick={cancel}>
          Cancel
        </Button>
      </div>
    </section>
  )
}
