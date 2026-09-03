'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/actions/auth'

const settingsSchema = z.object({
  siteStatus: z.enum(['open', 'closed']),
  siteStatusNote: z.string().trim().max(300).optional(),
  membershipYearLabel: z.string().trim().min(3).max(80),
  priceAdultPence: z.number().int().min(0).max(100_000),
  priceJuniorPence: z.number().int().min(0).max(100_000),
  priceFamilyPence: z.number().int().min(0).max(100_000),
  bankPaymentNote: z.string().trim().min(10).max(500),
  showUnconfirmed: z.boolean(),
  paymentProvider: z.enum(['off', 'simulated', 'paypal']),
})

export type SettingsInput = z.infer<typeof settingsSchema>

/**
 * P9-08 — the club settings screen. Admin-gated twice (here and by RLS).
 * Every save is audited with before/after so a price change is traceable.
 */
export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  await requireRole('admin')
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }

  const supabase = await createClient()
  const { data: before } = await supabase.from('club_settings').select('*').maybeSingle()
  if (!before) return { ok: false, message: 'Settings row missing' }

  const next = {
    site_status: parsed.data.siteStatus,
    site_status_note: parsed.data.siteStatusNote || null,
    membership_year_label: parsed.data.membershipYearLabel,
    price_adult_pence: parsed.data.priceAdultPence,
    price_junior_pence: parsed.data.priceJuniorPence,
    price_family_pence: parsed.data.priceFamilyPence,
    bank_payment_note: parsed.data.bankPaymentNote,
    show_unconfirmed: parsed.data.showUnconfirmed,
    payment_provider: parsed.data.paymentProvider,
  }
  const { error } = await supabase.from('club_settings').update(next).eq('id', true)
  if (error) return { ok: false, message: error.message }

  const changed: Record<string, { from: unknown; to: unknown }> = {}
  for (const key of Object.keys(next) as (keyof typeof next)[]) {
    if (before[key] !== next[key]) changed[key] = { from: before[key], to: next[key] }
  }
  await supabase.rpc('audit', {
    p_action: 'settings.updated',
    p_entity: 'club_settings',
    p_after: JSON.parse(JSON.stringify(changed)),
  })

  for (const path of ['/', '/join', '/welcome', '/members/membership', '/admin/settings']) {
    revalidatePath(path)
  }
  return { ok: true, message: 'Settings saved' }
}
