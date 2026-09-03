'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { updateSettingsAction, type SettingsInput } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const toPounds = (pence: number) => (pence / 100).toFixed(2)
const toPence = (pounds: string) => Math.round((Number(pounds) || 0) * 100)

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [siteStatus, setSiteStatus] = useState(initial.siteStatus)
  const [siteStatusNote, setSiteStatusNote] = useState(initial.siteStatusNote ?? '')
  const [yearLabel, setYearLabel] = useState(initial.membershipYearLabel)
  const [adult, setAdult] = useState(toPounds(initial.priceAdultPence))
  const [junior, setJunior] = useState(toPounds(initial.priceJuniorPence))
  const [family, setFamily] = useState(toPounds(initial.priceFamilyPence))
  const [bankNote, setBankNote] = useState(initial.bankPaymentNote)
  const [showUnconfirmed, setShowUnconfirmed] = useState(initial.showUnconfirmed)
  const [provider, setProvider] = useState(initial.paymentProvider)

  const save = () =>
    startTransition(async () => {
      const result = await updateSettingsAction({
        siteStatus,
        siteStatusNote: siteStatusNote || undefined,
        membershipYearLabel: yearLabel,
        priceAdultPence: toPence(adult),
        priceJuniorPence: toPence(junior),
        priceFamilyPence: toPence(family),
        bankPaymentNote: bankNote,
        showUnconfirmed,
        paymentProvider: provider,
      })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid max-w-2xl gap-4">
      <section className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Payments</h2>
        <div className="mt-4 grid gap-4">
          <Field
            label="Online payment"
            htmlFor="set-provider"
            helper={
              provider === 'simulated'
                ? 'Test gateway: members can pay online, no money moves. For testing only.'
                : provider === 'paypal'
                  ? 'Real PayPal — needs the club PayPal credentials in the environment (D1). The simulated gateway shuts off automatically.'
                  : 'Members pay the treasurer by bank transfer or cash; the committee records it here.'
            }
          >
            <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
              <SelectTrigger id="set-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off — treasurer only</SelectItem>
                <SelectItem value="simulated">Simulated gateway (testing)</SelectItem>
                <SelectItem value="paypal">PayPal (live)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Adult (£)" htmlFor="set-adult">
              <Input id="set-adult" inputMode="decimal" value={adult} onChange={(e) => setAdult(e.target.value)} />
            </Field>
            <Field label="Junior (£)" htmlFor="set-junior">
              <Input id="set-junior" inputMode="decimal" value={junior} onChange={(e) => setJunior(e.target.value)} />
            </Field>
            <Field label="Family (£)" htmlFor="set-family">
              <Input id="set-family" inputMode="decimal" value={family} onChange={(e) => setFamily(e.target.value)} />
            </Field>
          </div>
          <Field
            label="Bank payment instructions"
            htmlFor="set-bank"
            helper="Shown to members who choose the treasurer route."
          >
            <Textarea id="set-bank" rows={3} value={bankNote} onChange={(e) => setBankNote(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Membership year</h2>
        <div className="mt-4">
          <Field
            label="Label shown on the join page"
            htmlFor="set-year"
            helper='D2: once the committee settles when the year runs, put it here (e.g. "Runs April to March").'
          >
            <Input id="set-year" value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-stone bg-card p-5">
        <h2 className="text-lg">Site</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Site status" htmlFor="set-status" helper="Closed shows the banner across the public site.">
            <Select value={siteStatus} onValueChange={(v) => setSiteStatus(v as typeof siteStatus)}>
              <SelectTrigger id="set-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open — paddling as usual</SelectItem>
                <SelectItem value="closed">Closed — show a notice</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {siteStatus === 'closed' && (
            <Field label="Status note" htmlFor="set-status-note" optional>
              <Input
                id="set-status-note"
                value={siteStatusNote}
                onChange={(e) => setSiteStatusNote(e.target.value)}
                placeholder="e.g. River in flood — sessions off this week"
              />
            </Field>
          )}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-stone p-3">
            <div>
              <p className="text-sm font-medium">Show unconfirmed details</p>
              <p className="text-micro text-ink-muted">
                Facility cards and figures the committee hasn&apos;t signed off yet.
              </p>
            </div>
            <Switch
              checked={showUnconfirmed}
              onCheckedChange={setShowUnconfirmed}
              aria-label="Show unconfirmed details"
            />
          </div>
        </div>
      </section>

      <div>
        <Button variant="signal" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
