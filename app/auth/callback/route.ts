import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

/**
 * P3 — where every emailed auth link lands (sign-up confirmation, magic link,
 * password reset). The server client speaks PKCE, so the link carries a
 * one-time `code` that must be exchanged here for a session cookie before we
 * send the person on to `next`. Also accepts the `token_hash` + `type` form
 * (verified with the token itself, which works even on a different device).
 *
 * If the exchange fails — typically the link was opened in a different
 * browser from the one that started it — the email is still verified, so we
 * hand off to the login page with a notice rather than an error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  const login = new URL('/login', origin)
  login.searchParams.set('notice', 'verified')
  login.searchParams.set('next', next)
  return NextResponse.redirect(login)
}

/** Only ever send people to a path on this site. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/members'
  return value
}
