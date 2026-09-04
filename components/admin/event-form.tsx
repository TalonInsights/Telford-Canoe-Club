'use client'

/**
 * P5-02 — the committee's event editor. Built on the sourced primitives
 * (DateTimePicker, FileUpload, shadcn Select/Switch/Textarea) because the live
 * 21st.dev search found no event-form block (docs/plans/phase-05.md). §3.5
 * form rules: labels above, helper text under, one column per card, primary
 * action left; the cover photo goes straight to Storage under the committee
 * member's own session and the object path is saved with the row.
 */

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ImageOff } from 'lucide-react'
import { toast } from 'sonner'

import { saveEventAction } from '@/lib/actions/events'
import { emptyEventForm, eventRowToForm, formToInput, type EventFormValues } from '@/lib/events/form'
import { eventCoverPath, eventImageUrl } from '@/lib/events/images'
import { eventCategories, eventCategoryLabel, slugify, type EventCategory } from '@/lib/events/labels'
import type { EventRow } from '@/lib/queries/events'
import { uploadSiteImage } from '@/lib/storage/client-upload'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-picker'
import { FileUpload } from '@/components/ui/file-upload'
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

function Card({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-stone bg-card p-5">
      <h2 className="text-lg">{title}</h2>
      {intro && <p className="mt-1 text-sm text-ink-muted">{intro}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-stone p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-micro text-ink-muted">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}

export function EventForm({
  eventId,
  row,
  mode,
}: {
  eventId: string
  row?: EventRow | null
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [form, setForm] = useState<EventFormValues>(() =>
    row ? eventRowToForm(row) : emptyEventForm()
  )
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const save = (publish: boolean) =>
    startTransition(async () => {
      const result = await saveEventAction(formToInput(eventId, form), { publish })
      if (result.ok) {
        toast.success(result.message ?? 'Saved')
        if (mode === 'create') router.push(`/admin/events/${eventId}`)
        else router.refresh()
      } else {
        toast.error(result.message)
      }
    })

  const coverUrl = eventImageUrl(form.coverImagePath)

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
      <div className="grid gap-4 lg:col-span-7">
        <Card title="The basics" intro="The title and summary appear on every event card across the site.">
          <Field label="Title" htmlFor="ev-title">
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value
                setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
              }}
              placeholder="e.g. Club evening paddle"
            />
          </Field>
          <Field
            label="Web address"
            htmlFor="ev-slug"
            helper={`telfordcanoeclub.co.uk/events/${form.slug || '…'}`}
          >
            <Input
              id="ev-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value.replace(/\s+$/, '')) || e.target.value.toLowerCase())
              }}
            />
          </Field>
          <Field label="Type of event" htmlFor="ev-category">
            <Select value={form.category} onValueChange={(v) => set('category', v as EventCategory)}>
              <SelectTrigger id="ev-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {eventCategoryLabel[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Summary"
            htmlFor="ev-summary"
            helper="One or two sentences — what it is and who it's for. Shows on the cards."
          >
            <Textarea
              id="ev-summary"
              rows={2}
              maxLength={300}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>
          <Field
            label="Details"
            htmlFor="ev-details"
            optional
            helper="Everything a member needs: what to bring, meeting point, timings. Blank lines make paragraphs."
          >
            <Textarea
              id="ev-details"
              rows={7}
              value={form.details}
              onChange={(e) => set('details', e.target.value)}
            />
          </Field>
        </Card>

        <Card title="When and where">
          <Field label="Starts" htmlFor="ev-starts">
            <DateTimePicker value={form.startsAt} onChange={(d) => set('startsAt', d)} />
          </Field>
          <Field label="Ends" htmlFor="ev-ends" optional>
            <DateTimePicker value={form.endsAt} onChange={(d) => set('endsAt', d)} />
          </Field>
          <Field label="Location" htmlFor="ev-location">
            <Input
              id="ev-location"
              value={form.locationName}
              onChange={(e) => set('locationName', e.target.value)}
            />
          </Field>
          <Field label="Address" htmlFor="ev-address" optional>
            <Input
              id="ev-address"
              value={form.locationAddress}
              onChange={(e) => set('locationAddress', e.target.value)}
            />
          </Field>
        </Card>

        <Card title="Extras">
          <Field
            label="Who can see it"
            htmlFor="ev-visibility"
            helper="Members-only events stay off the public site and calendar."
          >
            <Select
              value={form.visibility}
              onValueChange={(v) => set('visibility', v as 'public' | 'members')}
            >
              <SelectTrigger id="ev-visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone</SelectItem>
                <SelectItem value="members">Current members only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Toggle
            label="Depends on river levels"
            hint="Shows the water-levels reminder and links to the gauge."
            checked={form.waterLevelDependent}
            onCheckedChange={(v) => set('waterLevelDependent', v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cost (£)" htmlFor="ev-cost" helper="0.00 for free">
              <Input
                id="ev-cost"
                inputMode="decimal"
                value={form.costPounds}
                onChange={(e) => set('costPounds', e.target.value)}
              />
            </Field>
            <Field label="Cost note" htmlFor="ev-cost-note" optional>
              <Input
                id="ev-cost-note"
                value={form.costNote}
                onChange={(e) => set('costNote', e.target.value)}
                placeholder="e.g. pay on the night"
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:col-span-5">
        <Card title="Picture" intro="Landscape works best — it fills the card and the top of the event page.">
          {coverUrl ? (
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-stone">
              <Image src={coverUrl} alt="" fill unoptimized sizes="480px" className="object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[3/2] items-center justify-center rounded-lg bg-deep text-white/40">
              <ImageOff aria-hidden="true" className="size-8" />
            </div>
          )}
          <FileUpload
            accept={['image/jpeg', 'image/png', 'image/webp']}
            maxSizeMb={10}
            multiple={false}
            label={coverUrl ? 'Replace the photo' : 'Upload a photo'}
            hint="JPG, PNG or WebP up to 10MB"
            upload={async (file, onProgress) => {
              onProgress(25)
              const path = await uploadSiteImage(eventCoverPath(eventId, file.name), file)
              onProgress(100)
              set('coverImagePath', path)
            }}
          />
          {coverUrl && (
            <div>
              <Button variant="ghost" size="sm" onClick={() => set('coverImagePath', null)}>
                Remove the photo
              </Button>
            </div>
          )}
        </Card>

        <Card title="Attendance">
          <Toggle
            label="Members confirm attendance"
            hint="Members press one button to say they're coming; the committee sees who."
            checked={form.bookingEnabled}
            onCheckedChange={(v) => set('bookingEnabled', v)}
          />
          {form.bookingEnabled && (
            <>
              <Field
                label="Places"
                htmlFor="ev-capacity"
                optional
                helper="Leave blank for no limit."
              >
                <Input
                  id="ev-capacity"
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  value={form.capacity}
                  onChange={(e) => set('capacity', e.target.value)}
                  className="max-w-32"
                />
              </Field>
              <Toggle
                label="Waitlist when full"
                hint="The next person moves up automatically if someone drops out."
                checked={form.allowWaitlist}
                onCheckedChange={(v) => set('allowWaitlist', v)}
              />
              <Toggle
                label="Current members only"
                hint="Off lets anyone with an account confirm — useful for open days."
                checked={form.membersOnlyBooking}
                onCheckedChange={(v) => set('membersOnlyBooking', v)}
              />
              <Field label="Confirmations open" htmlFor="ev-opens" optional helper="Blank = as soon as it's published.">
                <DateTimePicker value={form.bookingOpensAt} onChange={(d) => set('bookingOpensAt', d)} />
              </Field>
              <Field label="Confirmations close" htmlFor="ev-closes" optional helper="Blank = when the event starts.">
                <DateTimePicker value={form.bookingClosesAt} onChange={(d) => set('bookingClosesAt', d)} />
              </Field>
            </>
          )}
        </Card>

        <section className="rounded-xl border border-stone bg-card p-5">
          {mode === 'create' ? (
            <>
              <p className="text-sm text-ink-muted">
                Drafts are only visible here. Publishing puts the event on the site straight away.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="signal" disabled={pending} onClick={() => save(true)}>
                  {pending ? 'Saving…' : 'Save and publish'}
                </Button>
                <Button variant="outline" disabled={pending} onClick={() => save(false)}>
                  Save as draft
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                Changes show on the site as soon as you save. Publishing and cancelling live in the
                buttons at the top of the page.
              </p>
              <div className="mt-4">
                <Button variant="signal" disabled={pending} onClick={() => save(false)}>
                  {pending ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
