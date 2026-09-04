'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { HandCoins, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { requestMembershipAction } from '@/lib/actions/membership'
import { startOnlineCheckoutAction } from '@/lib/actions/payments'
import type { FamilyMemberInput } from '@/lib/membership/family'
import type { PaymentMode } from '@/lib/payments/mode'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Stepper } from '@/components/ui/stepper'
import { formatMoneyGBP } from '@/lib/format'
import { cn } from '@/lib/utils'

type Tier = { name: string; pricePence: number }
type TierKey = 'adult' | 'junior' | 'family'

const tierKeyByName: Record<string, TierKey> = {
  Adult: 'adult',
  Junior: 'junior',
  Family: 'family',
}

const emptyMember = (): FamilyMemberInput => ({
  name: '',
  dob: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
})

export function WelcomeClient({
  tiers,
  yearLabel,
  bankNote,
  paymentProvider,
  renewPeriod,
}: {
  tiers: Tier[]
  yearLabel: string
  bankNote: string
  paymentProvider: PaymentMode
  renewPeriod: { id: string; label: string } | null
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<TierKey | null>(null)
  const [family, setFamily] = useState<FamilyMemberInput[]>([emptyMember()])
  const [step, setStep] = useState(1)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<'online' | 'manual' | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const onlineOn = isOnlinePaymentOn(paymentProvider)
  const selectedTier = tiers.find((t) => tierKeyByName[t.name] === selected)
  const familyMembers = () => (selected === 'family' ? family.filter((m) => m.name.trim()) : [])
  const setMember = (i: number, patch: Partial<FamilyMemberInput>) =>
    setFamily((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)))

  const payOnline = () =>
    startTransition(async () => {
      if (!selected) return
      setBusy('online')
      const result = await startOnlineCheckoutAction({
        tier: selected,
        family: familyMembers(),
        periodId: renewPeriod?.id,
      })
      setBusy(null)
      if (result.ok) {
        router.push(result.redirect)
      } else {
        toast.error(result.message)
      }
    })

  const payTreasurer = () =>
    startTransition(async () => {
      if (!selected) return
      setBusy('manual')
      const result = await requestMembershipAction({
        tier: selected,
        family: familyMembers(),
        periodId: renewPeriod?.id,
      })
      setBusy(null)
      if (result.ok) {
        setConfirmed(true)
        setStep(2)
        toast.success('Membership requested')
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-xl border border-stone bg-card p-6 sm:p-8">
        <h1 className="text-2xl">
          {renewPeriod ? `Renew for ${renewPeriod.label}` : 'Choose your membership'}
        </h1>
        <div className="mt-4">
          <Stepper steps={['Create account', 'Choose tier', 'Pay']} current={step} />
        </div>

        {confirmed ? (
          <div className="mt-6 rounded-lg border border-success/30 bg-foam p-5">
            <h2 className="text-lg text-success">Membership requested</h2>
            <p className="mt-2 text-sm text-ink-muted">{bankNote}</p>
            {onlineOn && (
              <p className="mt-2 text-sm text-ink-muted">
                Changed your mind? You can still pay online from your membership page — it
                activates instantly.
              </p>
            )}
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/members/membership">See my membership</Link>
            </Button>
          </div>
        ) : (
          <>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium">
                Pick a tier — {(renewPeriod ? `${renewPeriod.label} membership` : yearLabel).toLowerCase()}
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {tiers.map((tier) => {
                  const key = tierKeyByName[tier.name] ?? 'adult'
                  const active = selected === key
                  return (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        active ? 'border-river bg-foam' : 'border-stone bg-card hover:border-river'
                      )}
                    >
                      <span className="block font-medium">{tier.name}</span>
                      <span className="block font-heading text-2xl font-semibold tabular-nums">
                        {formatMoneyGBP(tier.pricePence)}
                      </span>
                      <span className="block text-micro text-ink-muted">
                        {key === 'family' ? 'Everyone at one address' : key === 'junior' ? 'Under 18' : 'Aged 18 and over'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {selected === 'family' && (
              <div className="mt-5 rounded-lg border border-river/40 bg-foam p-4">
                <p className="text-sm font-medium">Who else is at your address?</p>
                <p className="mt-1 text-micro text-ink-muted">
                  You&apos;re included automatically. Add each person the membership covers — the
                  date of birth lets us flag juniors, and each person keeps their own emergency
                  contact.
                </p>
                <div className="mt-3 grid gap-4">
                  {family.map((member, i) => (
                    <fieldset key={i} className="grid gap-3 rounded-lg border border-stone bg-card p-3">
                      <legend className="px-1 text-micro font-medium text-ink-muted">
                        Family member {i + 1}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Full name" htmlFor={`fam-name-${i}`}>
                          <Input
                            id={`fam-name-${i}`}
                            value={member.name}
                            onChange={(e) => setMember(i, { name: e.target.value })}
                          />
                        </Field>
                        <Field label="Date of birth" htmlFor={`fam-dob-${i}`} optional>
                          <Input
                            id={`fam-dob-${i}`}
                            type="date"
                            value={member.dob ?? ''}
                            onChange={(e) => setMember(i, { dob: e.target.value })}
                          />
                        </Field>
                        <Field label="Emergency contact name" htmlFor={`fam-ecn-${i}`} optional>
                          <Input
                            id={`fam-ecn-${i}`}
                            value={member.emergencyContactName ?? ''}
                            onChange={(e) => setMember(i, { emergencyContactName: e.target.value })}
                          />
                        </Field>
                        <Field label="Emergency contact phone" htmlFor={`fam-ecp-${i}`} optional>
                          <Input
                            id={`fam-ecp-${i}`}
                            type="tel"
                            value={member.emergencyContactPhone ?? ''}
                            onChange={(e) => setMember(i, { emergencyContactPhone: e.target.value })}
                          />
                        </Field>
                      </div>
                      {family.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-self-start"
                          onClick={() => setFamily((fs) => fs.filter((_, j) => j !== i))}
                        >
                          Remove
                        </Button>
                      )}
                    </fieldset>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setFamily((fs) => [...fs, emptyMember()])}
                >
                  Add another person
                </Button>
              </div>
            )}

            <div className="mt-6 grid gap-2 sm:max-w-md">
              {onlineOn && (
                <Button variant="signal" size="lg" disabled={!selected || pending} onClick={payOnline}>
                  <Zap aria-hidden="true" />
                  {busy === 'online'
                    ? 'Opening checkout…'
                    : selectedTier
                      ? `Pay ${formatMoneyGBP(selectedTier.pricePence)} online now`
                      : 'Pay online now'}
                </Button>
              )}
              <Button
                variant={onlineOn ? 'outline' : 'signal'}
                size={onlineOn ? 'default' : 'lg'}
                disabled={!selected || pending}
                onClick={payTreasurer}
              >
                <HandCoins aria-hidden="true" />
                {busy === 'manual' ? 'Requesting…' : 'Pay the treasurer by bank transfer or cash'}
              </Button>
              <p className="mt-1 text-micro text-ink-muted">
                {onlineOn
                  ? 'Online payment activates your membership instantly. The treasurer route stays open if you prefer it.'
                  : 'No payment is taken online yet — the next step explains how to pay the treasurer.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
