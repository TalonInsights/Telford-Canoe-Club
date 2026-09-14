'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

import { updateProfileAction } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * A member keeping their own record right.
 *
 * Almost everything here is theirs to change, including their name — people
 * do change names, and a club that makes you email the committee about it
 * ends up with a members list that is quietly wrong.
 *
 * Two things are not theirs to change, and the form says why rather than
 * simply disabling a box: the email address is what they log in with, and a
 * date of birth already on file decides junior status.
 */

export type ProfileValues = {
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

function Locked({ label, value, why }: { label: string; value: string; why: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm">
        <Lock aria-hidden="true" className="size-3.5 shrink-0 text-ink-muted" />
        <span>{value || 'Not recorded'}</span>
      </p>
      <p className="mt-1 text-micro text-ink-muted">{why}</p>
    </div>
  )
}

export function ProfileForm({
  initial,
  email,
  dobOnFile,
}: {
  initial: ProfileValues
  email: string
  /** A date of birth already recorded is committee-only from here on. */
  dobOnFile: boolean
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [pending, startTransition] = useTransition()

  const set =
    (k: keyof ProfileValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }))

  return (
    <form
      noValidate
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await updateProfileAction(values)
          if (result.ok) {
            toast.success(result.message ?? 'Saved')
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      <section className="grid gap-4 rounded-xl border border-stone bg-card p-6">
        <h2 className="text-lg">You</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="pf-first">
            <Input id="pf-first" autoComplete="given-name" value={values.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name" htmlFor="pf-last">
            <Input id="pf-last" autoComplete="family-name" value={values.lastName} onChange={set('lastName')} />
          </Field>
        </div>

        <Locked
          label="Email address"
          value={email}
          why="This is what you log in with, so it is changed by the committee rather than here."
        />

        {dobOnFile ? (
          <Locked
            label="Date of birth"
            value={initial.dateOfBirth}
            why="Already on file. Ask the committee if it is wrong — it decides junior status, so it is not changed from this page."
          />
        ) : (
          <Field
            label="Date of birth"
            htmlFor="pf-dob"
            helper="We do not have this yet. Once saved, the committee makes any later correction."
          >
            <Input
              id="pf-dob"
              type="date"
              className="max-w-52"
              value={values.dateOfBirth}
              onChange={set('dateOfBirth')}
            />
          </Field>
        )}
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-6">
        <h2 className="text-lg">How the club reaches you</h2>
        <Field label="Phone" htmlFor="pf-phone">
          <Input id="pf-phone" type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} />
        </Field>
        <Field label="Address line 1" htmlFor="pf-a1">
          <Input id="pf-a1" autoComplete="address-line1" value={values.addressLine1} onChange={set('addressLine1')} />
        </Field>
        <Field label="Address line 2" htmlFor="pf-a2" optional>
          <Input id="pf-a2" autoComplete="address-line2" value={values.addressLine2} onChange={set('addressLine2')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town" htmlFor="pf-town">
            <Input id="pf-town" autoComplete="address-level2" value={values.town} onChange={set('town')} />
          </Field>
          <Field label="Postcode" htmlFor="pf-pc" helper="Like TF8 7HJ">
            <Input id="pf-pc" autoComplete="postal-code" className="max-w-40" value={values.postcode} onChange={set('postcode')} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-6">
        <h2 className="text-lg">If something goes wrong on the water</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emergency contact name" htmlFor="pf-ecn" optional>
            <Input id="pf-ecn" value={values.emergencyContactName} onChange={set('emergencyContactName')} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="pf-ecp" optional>
            <Input id="pf-ecp" type="tel" value={values.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Parent or guardian name"
            htmlFor="pf-gn"
            helper="Needed for under-18 members."
            optional
          >
            <Input id="pf-gn" value={values.guardianName} onChange={set('guardianName')} />
          </Field>
          <Field label="Parent or guardian phone" htmlFor="pf-gp" optional>
            <Input id="pf-gp" type="tel" value={values.guardianPhone} onChange={set('guardianPhone')} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-6">
        <h2 className="text-lg">Club admin</h2>
        <Field
          label="Paddle UK membership number"
          htmlFor="pf-bc"
          optional
          helper="Helps the club line up its affiliation records."
        >
          <Input id="pf-bc" value={values.bcNumber} onChange={set('bcNumber')} />
        </Field>
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <Checkbox
            checked={values.emailOptIn}
            onCheckedChange={(v) => setValues((s) => ({ ...s, emailOptIn: !!v }))}
          />
          Email me club news (booking and membership emails always arrive)
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <p className="text-micro text-ink-muted">
          Changes to your record are logged, so the committee can see what changed and when.
        </p>
      </div>
    </form>
  )
}
