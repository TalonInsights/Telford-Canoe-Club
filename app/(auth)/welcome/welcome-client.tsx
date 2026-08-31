'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { requestMembershipAction } from '@/lib/actions/membership'
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

export function WelcomeClient({
  tiers,
  yearLabel,
  bankNote,
}: {
  tiers: Tier[]
  yearLabel: string
  bankNote: string
}) {
  const [selected, setSelected] = useState<TierKey | null>(null)
  const [familyNames, setFamilyNames] = useState<string[]>(['', ''])
  const [step, setStep] = useState(1)
  const [pending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)

  const submit = () =>
    startTransition(async () => {
      if (!selected) return
      const result = await requestMembershipAction({
        tier: selected,
        familyNames: selected === 'family' ? familyNames.filter((n) => n.trim()) : [],
      })
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
        <h1 className="text-2xl">Choose your membership</h1>
        <div className="mt-4">
          <Stepper steps={['Create account', 'Choose tier', 'Pay the treasurer']} current={step} />
        </div>

        {confirmed ? (
          <div className="mt-6 rounded-lg border border-success/30 bg-foam p-5">
            <h2 className="text-lg text-success">Membership requested</h2>
            <p className="mt-2 text-sm text-ink-muted">{bankNote}</p>
            <p className="mt-2 text-sm text-ink-muted">
              Card payment through the site is on its way — until then this is the official
              route, and your membership shows as pending until the committee confirms it.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/members/membership">See my membership</Link>
            </Button>
          </div>
        ) : (
          <>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium">
                Pick a tier — {yearLabel.toLowerCase()}
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
                  You&apos;re included automatically — add everyone else covered by the family
                  membership.
                </p>
                <div className="mt-3 grid gap-3">
                  {familyNames.map((name, i) => (
                    <Field key={i} label={`Family member ${i + 1}`} htmlFor={`fam-${i}`} optional>
                      <Input
                        id={`fam-${i}`}
                        value={name}
                        onChange={(e) =>
                          setFamilyNames((names) => names.map((n, j) => (j === i ? e.target.value : n)))
                        }
                      />
                    </Field>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setFamilyNames((names) => [...names, ''])}
                >
                  Add another person
                </Button>
              </div>
            )}

            <div className="mt-6">
              <Button variant="signal" size="lg" disabled={!selected || pending} onClick={submit}>
                {pending ? 'Requesting…' : 'Request this membership'}
              </Button>
              <p className="mt-2 text-micro text-ink-muted">
                No payment is taken online yet — the next step explains how to pay the treasurer.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
