import 'server-only'

import type { PaymentProvider } from '@/lib/payments/provider'

/**
 * Real PayPal Orders v2 client (P4-01). DORMANT until D1 is answered and the
 * club's REST app credentials are pasted into the environment:
 *   PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_ENV (sandbox|live)
 *   PAYPAL_WEBHOOK_ID (for signature verification)
 * Switching club_settings.payment_provider to 'paypal' without them makes
 * every call fail loudly with a clear message rather than half-working.
 */

const base = () =>
  (process.env.PAYPAL_ENV ?? 'sandbox') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken(): Promise<string> {
  if (!isPaypalConfigured()) {
    throw new Error('PayPal is not configured — set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (D1)')
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`PayPal token request failed (${res.status})`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return cachedToken.value
}

async function paypalFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await accessToken()
  return fetch(`${base()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  })
}

export const paypalProvider: PaymentProvider = {
  mode: 'paypal',

  async createOrder(input) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://telford-canoe-club.vercel.app'
    const res = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'GBP', value: (input.amountPence / 100).toFixed(2) },
            description: `Telford Canoe Club ${input.tier} membership — ${input.periodLabel}`,
            custom_id: `${input.userId}|${input.tier}|${input.periodId}`,
            invoice_id: `TCC-${input.periodLabel}-${input.userId.slice(0, 8)}`,
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'Telford Canoe Club',
              user_action: 'PAY_NOW',
              return_url: `${siteUrl}/checkout/return`,
              cancel_url: `${siteUrl}/members/membership`,
            },
          },
        },
      }),
    })
    if (!res.ok) throw new Error(`PayPal create order failed (${res.status})`)
    const json = (await res.json()) as {
      id: string
      links?: { rel: string; href: string }[]
    }
    const approve =
      json.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href ?? null
    if (!approve) throw new Error('PayPal order created but no approval link returned')
    return { orderRef: json.id, approveUrl: approve }
  },

  async captureOrder(orderRef) {
    const res = await paypalFetch(`/v2/checkout/orders/${orderRef}/capture`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const json = (await res.json().catch(() => null)) as {
      status?: string
      purchase_units?: {
        payments?: { captures?: { id: string; status: string }[] }
      }[]
    } | null
    const capture = json?.purchase_units?.[0]?.payments?.captures?.[0]
    if (res.ok && json?.status === 'COMPLETED' && capture?.id) {
      return { status: 'completed', captureRef: capture.id }
    }
    return {
      status: 'declined',
      reason: `PayPal capture not completed (${json?.status ?? res.status})`,
    }
  },
}

/**
 * P4-03 — webhook signature verification via PayPal's own API. Returns false
 * (never throws) on any shortfall so the webhook route can 400 cleanly.
 */
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId || !isPaypalConfigured()) return false
  try {
    const res = await paypalFetch('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    })
    if (!res.ok) return false
    const json = (await res.json()) as { verification_status?: string }
    return json.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}
