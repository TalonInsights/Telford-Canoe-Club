'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { Check, Search, UserRoundPlus } from 'lucide-react'
import { toast } from 'sonner'

import { adminCreateMembershipAction } from '@/lib/actions/membership'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'

type Person = { userId: string; name: string; email: string; role: string }
type Period = { id: string; label: string; isCurrent: boolean }
type TierKey = 'adult' | 'junior' | 'family'
type Source = 'manual_cash' | 'manual_bank' | 'complimentary' | 'imported'

export function AddMembershipForm({
  people,
  periods,
  prices,
}: {
  people: Person[]
  periods: Period[]
  prices: Record<TierKey, number>
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [tier, setTier] = useState<TierKey>('adult')
  const [periodId, setPeriodId] = useState(periods.find((p) => p.isCurrent)?.id ?? periods[0]?.id ?? '')
  const [source, setSource] = useState<Source>('manual_cash')
  const [amount, setAmount] = useState<string>('')
  const [activate, setActivate] = useState(true)
  const [note, setNote] = useState('')
  const [familyNames, setFamilyNames] = useState<string[]>(['', ''])
  const [pending, startTransition] = useTransition()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people.slice(0, 8)
    return people
      .filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      .slice(0, 8)
  }, [people, query])

  const selected = people.find((p) => p.userId === userId) ?? null
  const defaultAmount = source === 'complimentary' ? 0 : prices[tier]
  const amountPence = amount.trim() === '' ? defaultAmount : Math.round((Number(amount) || 0) * 100)

  const submit = () =>
    startTransition(async () => {
      if (!userId || !periodId) return
      const result = await adminCreateMembershipAction({
        userId,
        tier,
        periodId,
        source,
        amountPence: amount.trim() === '' && source !== 'complimentary' ? undefined : amountPence,
        activate,
        note: note || undefined,
        familyNames: tier === 'family' ? familyNames.filter((n) => n.trim()) : [],
      })
      if (result.ok) {
        toast.success(result.message ?? 'Membership created')
        router.push('/admin/members')
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid max-w-2xl gap-4">
      <section className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Who is it for?</h2>
        <div className="mt-3">
          <Field label="Search accounts" htmlFor="am-search" helper="Name or email.">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <Input
                id="am-search"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Smith"
              />
            </div>
          </Field>
          <ul className="mt-3 grid gap-2" aria-label="Matching accounts">
            {matches.map((p) => {
              const active = p.userId === userId
              return (
                <li key={p.userId}>
                  <button
                    type="button"
                    onClick={() => setUserId(active ? null : p.userId)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                      active ? 'border-river bg-foam' : 'border-stone bg-card hover:border-river'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-micro text-ink-muted">{p.email}</span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-river" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
            {matches.length === 0 && (
              <li className="rounded-lg border border-stone p-3 text-sm text-ink-muted">
                No account matches — they can register at /join first.
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">The membership</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tier" htmlFor="am-tier">
            <Select value={tier} onValueChange={(v) => setTier(v as TierKey)}>
              <SelectTrigger id="am-tier" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Membership year" htmlFor="am-period">
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger id="am-period" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {p.isCurrent ? ' (current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="How are they paying?" htmlFor="am-source">
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger id="am-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_cash">Cash</SelectItem>
                <SelectItem value="manual_bank">Bank transfer</SelectItem>
                <SelectItem value="complimentary">Complimentary — no payment</SelectItem>
                <SelectItem value="imported">Imported from the old site</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Amount (£)"
            htmlFor="am-amount"
            optional
            helper={`Blank = ${formatMoneyGBP(defaultAmount)}${source === 'complimentary' ? '' : ' (the list price)'}.`}
          >
            <Input
              id="am-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={(defaultAmount / 100).toFixed(2)}
            />
          </Field>
        </div>

        {tier === 'family' && (
          <div className="mt-4 rounded-lg border border-river/40 bg-foam p-4">
            <p className="text-sm font-medium">Everyone else at their address</p>
            <div className="mt-3 grid gap-3">
              {familyNames.map((name, i) => (
                <Field key={i} label={`Family member ${i + 1}`} htmlFor={`am-fam-${i}`} optional>
                  <Input
                    id={`am-fam-${i}`}
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

        <div className="mt-4 grid gap-4">
          <Field label="Note" htmlFor="am-note" optional>
            <Input
              id="am-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. paid at the Tuesday session"
            />
          </Field>
          <label className="flex items-center gap-3 rounded-lg border border-stone p-3">
            <Checkbox checked={activate} onCheckedChange={(v) => setActivate(v === true)} />
            <span>
              <span className="block text-sm font-medium">Activate immediately</span>
              <span className="block text-micro text-ink-muted">
                Untick to create it as pending (goes into the payments-to-record queue).
              </span>
            </span>
          </label>
        </div>
      </section>

      <div>
        <Button variant="signal" size="lg" disabled={pending || !userId || !periodId} onClick={submit}>
          <UserRoundPlus aria-hidden="true" />
          {pending
            ? 'Creating…'
            : selected
              ? `${activate ? 'Activate' : 'Create'} for ${selected.name} · ${formatMoneyGBP(amountPence)}`
              : 'Pick an account first'}
        </Button>
      </div>
    </div>
  )
}
