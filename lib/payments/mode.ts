/**
 * Shared (client-safe) payment mode type — the value lives in
 * club_settings.payment_provider and is enforced inside the database
 * functions; see lib/payments/provider.ts for the server-side providers.
 */
export type PaymentMode = 'off' | 'simulated' | 'paypal'

export function isOnlinePaymentOn(mode: PaymentMode): boolean {
  return mode === 'simulated' || mode === 'paypal'
}
