'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { updateProfileAction } from '@/lib/actions/membership'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

type ProfileValues = {
  phone: string
  addressLine1: string
  addressLine2: string
  town: string
  postcode: string
  bcNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emailOptIn: boolean
}

export function ProfileForm({
  initial,
  name,
  email,
}: {
  initial: ProfileValues
  name: string
  email: string
}) {
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof ProfileValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  return (
    <form
      noValidate
      className="grid gap-4 rounded-xl border border-stone bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        const result = await updateProfileAction(values)
        setSaving(false)
        if (result.ok) toast.success(result.message ?? 'Saved')
        else toast.error(result.message)
      }}
    >
      <div className="border-b border-stone pb-4">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-ink-muted">{email}</p>
        <p className="mt-1 text-micro text-ink-muted">
          Name or email wrong? Email the committee and they&apos;ll fix your record.
        </p>
      </div>
      <Field label="Phone" htmlFor="pf-phone">
        <Input id="pf-phone" type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} />
      </Field>
      <Field label="Address line 1" htmlFor="pf-a1">
        <Input id="pf-a1" autoComplete="address-line1" value={values.addressLine1} onChange={set('addressLine1')} />
      </Field>
      <Field label="Address line 2" htmlFor="pf-a2" optional>
        <Input id="pf-a2" autoComplete="address-line2" value={values.addressLine2} onChange={set('addressLine2')} />
      </Field>
      <Field label="Town" htmlFor="pf-town">
        <Input id="pf-town" autoComplete="address-level2" value={values.town} onChange={set('town')} />
      </Field>
      <Field label="Postcode" htmlFor="pf-pc" helper="Like TF8 7HJ">
        <Input id="pf-pc" autoComplete="postal-code" className="max-w-40" value={values.postcode} onChange={set('postcode')} />
      </Field>
      <Field
        label="Paddle UK membership number"
        htmlFor="pf-bc"
        optional
        helper="Helps the club line up its affiliation records."
      >
        <Input id="pf-bc" value={values.bcNumber} onChange={set('bcNumber')} />
      </Field>
      <Field label="Emergency contact name" htmlFor="pf-ecn" optional>
        <Input id="pf-ecn" value={values.emergencyContactName} onChange={set('emergencyContactName')} />
      </Field>
      <Field label="Emergency contact phone" htmlFor="pf-ecp" optional>
        <Input id="pf-ecp" type="tel" value={values.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
      </Field>
      <label className="flex min-h-11 items-center gap-2.5 text-sm">
        <Checkbox
          checked={values.emailOptIn}
          onCheckedChange={(v) => setValues((s) => ({ ...s, emailOptIn: !!v }))}
        />
        Email me club news (booking and membership emails always arrive)
      </label>
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
