import 'server-only'

import { simulatedProvider } from '@/lib/payments/simulated'
import { paypalProvider } from '@/lib/payments/paypal'

/**
 * The switch lives in club_settings.payment_provider (admin-editable, and
 * enforced again inside the database functions — see 0018_payments.sql).
 *   off       — online payment hidden; bank/cash via the treasurer only
 *   simulated — the test gateway at /checkout/[ref]; no money moves
 *   paypal    — the real Orders v2 client (needs the D1 credentials)
 */
export type PaymentMode = 'off' | 'simulated' | 'paypal'

export type CreateOrderInput = {
  membershipId: string
  tier: 'adult' | 'junior' | 'family'
  periodId: string
  periodLabel: string
  userId: string
  amountPence: number
}

export type CreatedOrder = { orderRef: string; approveUrl: string }

export type CaptureResult =
  | { status: 'completed'; captureRef: string }
  | { status: 'declined'; reason: string }

export interface PaymentProvider {
  readonly mode: 'simulated' | 'paypal'
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>
  captureOrder(
    orderRef: string,
    opts?: { simulateOutcome?: 'completed' | 'declined' }
  ): Promise<CaptureResult>
}

export function getPaymentProvider(mode: PaymentMode): PaymentProvider | null {
  if (mode === 'simulated') return simulatedProvider
  if (mode === 'paypal') return paypalProvider
  return null
}
