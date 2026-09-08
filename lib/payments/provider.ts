import 'server-only'

import { simulatedProvider } from '@/lib/payments/simulated'
import { paypalProvider } from '@/lib/payments/paypal'
import type { PaymentMode } from '@/lib/payments/mode'

/**
 * The switch lives in club_settings.payment_provider (admin-editable, and
 * enforced again inside the database functions — see 0018_payments.sql).
 *   off       — online payment hidden; bank/cash via the treasurer only
 *   simulated — the test gateway at /checkout/[ref]; no money moves
 *   paypal    — the real Orders v2 client (needs the D1 credentials)
 */
export type { PaymentMode }

export type CreateOrderInput = {
  membershipId: string
  tier: 'adult' | 'junior' | 'family'
  periodId: string
  periodLabel: string
  userId: string
  amountPence: number
}

/**
 * A shop order (8 Sep 2026). Kept separate from the membership input rather
 * than generalised into one shape: the two carry genuinely different
 * references, land in different tables, and must never be mistaken for one
 * another by a gateway callback.
 */
export type CreateMerchOrderInput = {
  orderId: string
  userId: string
  amountPence: number
  description: string
}

export type CreatedOrder = { orderRef: string; approveUrl: string }

export type CaptureResult =
  | { status: 'completed'; captureRef: string }
  | { status: 'declined'; reason: string }

export interface PaymentProvider {
  readonly mode: 'simulated' | 'paypal'
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>
  createMerchOrder(input: CreateMerchOrderInput): Promise<CreatedOrder>
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
