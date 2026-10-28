'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'

import { adminCreateMemberAction } from '@/lib/actions/accounts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

/**
 * Add one member and carry their details across (Simon, 28 Oct). A plain,
 * sectioned form so the committee can copy a returning member's record from the
 * old system in one pass. Only name and email are required; everything else is
 * filled in if known. The set-password invite is off by default.
 */

type Values = {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  phone: string
  addressLine1: string
  addressLine2: string
  town: string
  postcode: string
  emergencyContactName: string
  emergencyContactPhone: string
  guardianName: string
  guardianPhone: string
  bcNumber: string
  carRegistration: string
}

const empty: Values = {
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  town: '',
  postcode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  guardianName: '',
  guardianPhone: '',
  bcNumber: '',
  carRegistration: '',
}

/** Under-18 on the date typed, to prompt for a guardian inline. */
function isUnder18(dob: string): boolean {
  if (!dob) return false
  const d = new Date(dob)
  if (Number.isNaN(+d)) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return d > cutoff
}

export function AddAccountForm() {
  const router = useRouter()
  const [v, setV] = useState<Values>(empty)
  const [sendInvite, setSendInvite] = useState(false)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<{ userId: string; name: string; invited: boolean; emailLive: boolean } | null>(null)

  const set =
    (k: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setV((s) => ({ ...s, [k]: e.target.value }))

  const junior = isUnder18(v.dateOfBirth)

  const submit = () =>
    startTransition(async () => {
      const result = await adminCreateMemberAction({ ...v, sendInvite })
      if (result.ok) {
        setDone({ userId: result.userId, name: result.name, invited: result.invited, emailLive: result.emailLive })
        toast.success(`${result.name}'s account created`)
      } else {
        toast.error(result.message)
      }
    })

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-foam p-6">
        <p className="flex items-center gap-2 font-medium text-success">
          <Check aria-hidden="true" className="size-5" /> {done.name}&apos;s account is set up
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {done.invited
            ? 'They have been emailed a link to set their password.'
            : sendInvite && !done.emailLive
              ? 'No invite was sent: the club email system is not live yet (D5). You can send it later from their record.'
              : 'No invite was sent. They can be sent a set-password link later, or you can hand them one.'}
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Next, record their membership so they are a current member, then their details are all in
          one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="signal">
            <Link href="/admin/members/new">
              Add their membership <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/members/${done.userId}`}>Open their record</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setV(empty)
              setSendInvite(false)
              setDone(null)
              router.refresh()
            }}
          >
            Add another member
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Who they are</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="aa-first">
            <Input id="aa-first" value={v.firstName} onChange={set('firstName')} autoComplete="off" />
          </Field>
          <Field label="Last name" htmlFor="aa-last">
            <Input id="aa-last" value={v.lastName} onChange={set('lastName')} autoComplete="off" />
          </Field>
        </div>
        <Field label="Email" htmlFor="aa-email" helper="What they will log in with. It cannot be changed here afterwards.">
          <Input id="aa-email" type="email" value={v.email} onChange={set('email')} autoComplete="off" />
        </Field>
        <Field label="Date of birth" htmlFor="aa-dob" optional helper="Sets junior status, so worth carrying over.">
          <Input id="aa-dob" type="date" className="max-w-52" value={v.dateOfBirth} onChange={set('dateOfBirth')} />
        </Field>
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">How the club reaches them</h2>
        <Field label="Phone" htmlFor="aa-phone" optional>
          <Input id="aa-phone" type="tel" value={v.phone} onChange={set('phone')} />
        </Field>
        <Field label="Address line 1" htmlFor="aa-a1" optional>
          <Input id="aa-a1" value={v.addressLine1} onChange={set('addressLine1')} />
        </Field>
        <Field label="Address line 2" htmlFor="aa-a2" optional>
          <Input id="aa-a2" value={v.addressLine2} onChange={set('addressLine2')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town" htmlFor="aa-town" optional>
            <Input id="aa-town" value={v.town} onChange={set('town')} />
          </Field>
          <Field label="Postcode" htmlFor="aa-pc" optional>
            <Input id="aa-pc" className="max-w-40" value={v.postcode} onChange={set('postcode')} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">If something goes wrong on the water</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emergency contact name" htmlFor="aa-ecn" optional>
            <Input id="aa-ecn" value={v.emergencyContactName} onChange={set('emergencyContactName')} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="aa-ecp" optional>
            <Input id="aa-ecp" type="tel" value={v.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Parent or guardian name"
            htmlFor="aa-gn"
            optional={!junior}
            helper={junior ? 'Required: this date of birth is under 18.' : 'For under-18 members.'}
          >
            <Input id="aa-gn" value={v.guardianName} onChange={set('guardianName')} />
          </Field>
          <Field label="Parent or guardian phone" htmlFor="aa-gp" optional={!junior}>
            <Input id="aa-gp" type="tel" value={v.guardianPhone} onChange={set('guardianPhone')} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Club admin</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paddle UK / governing body number" htmlFor="aa-bc" optional>
            <Input id="aa-bc" value={v.bcNumber} onChange={set('bcNumber')} />
          </Field>
          <Field label="Car registration" htmlFor="aa-car" optional helper="Committee and admins only.">
            <Input id="aa-car" className="uppercase" value={v.carRegistration} onChange={set('carRegistration')} />
          </Field>
        </div>
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={sendInvite} onCheckedChange={(x) => setSendInvite(!!x)} className="mt-0.5" />
          <span>
            Email them a link to set their password now
            <span className="mt-0.5 block text-micro text-ink-muted">
              Leave off while you carry over data. It only sends once the club email is live, and
              you can send it later from their record.
            </span>
          </span>
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="signal"
          disabled={pending || !v.firstName.trim() || !v.lastName.trim() || !v.email.includes('@')}
          onClick={submit}
        >
          {pending ? 'Creating…' : 'Create the account'}
        </Button>
        <p className="text-micro text-ink-muted">
          Only name and email are required — fill in whatever you have.
        </p>
      </div>
    </div>
  )
}
