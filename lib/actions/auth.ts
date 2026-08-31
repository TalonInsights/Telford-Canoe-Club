'use server'

import { redirect } from 'next/navigation'

import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import {
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  type MagicLinkValues,
  type SignInValues,
  type SignUpValues,
} from '@/lib/schemas/auth'

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string }

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3030'
}

export async function signUpAction(values: SignUpValues): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = signUpSchema.safeParse(values)
  if (!parsed.success) return { ok: false, message: 'Check the form and try again' }
  const v = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      emailRedirectTo: `${siteUrl()}/verify`,
      data: { first_name: v.firstName, last_name: v.lastName },
    },
  })
  if (error) return { ok: false, message: error.message }

  // The signup trigger created the profile; fill in the §5.2 fields it
  // couldn't know. RLS: own-row update.
  if (data.user) {
    await supabase
      .from('profiles')
      .update({
        phone: v.phone,
        address_line1: v.addressLine1,
        address_line2: v.addressLine2 || null,
        town: v.town,
        postcode: v.postcode.toUpperCase(),
        date_of_birth: v.dateOfBirth,
        bc_membership_number: v.bcNumber || null,
        guardian_name: v.guardianName || null,
        guardian_phone: v.guardianPhone || null,
      })
      .eq('user_id', data.user.id)
  }

  return {
    ok: true,
    message:
      'Account created — check your email and tap the verification link, then come back and log in.',
  }
}

export async function signInAction(values: SignInValues): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = signInSchema.safeParse(values)
  if (!parsed.success) return { ok: false, message: 'Check the form and try again' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { ok: false, message: 'Wrong email or password — try again, or use an email link' }
  redirect('/members')
}

export async function magicLinkAction(values: MagicLinkValues): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = magicLinkSchema.safeParse(values)
  if (!parsed.success) return { ok: false, message: 'Enter your email address' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/members` },
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Check your email — the login link is on its way.' }
}

export async function forgotPasswordAction(values: MagicLinkValues): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const parsed = magicLinkSchema.safeParse(values)
  if (!parsed.success) return { ok: false, message: 'Enter your email address' }
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/reset-password`,
  })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Check your email for the reset link.' }
}

export async function resetPasswordAction(password: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  if (typeof password !== 'string' || password.length < 10) {
    return { ok: false, message: 'Use at least 10 characters — a short sentence works well' }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, message: error.message }
  redirect('/members')
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
