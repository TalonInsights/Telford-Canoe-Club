import 'server-only'

import { randomBytes } from 'node:crypto'

import type { PaymentProvider } from '@/lib/payments/provider'

/**
 * The simulated gateway. Order refs are opaque (`SIM-…`) and carry no
 * authority — activation is decided by `complete_online_payment()` in the
 * database, which only honours a caller-initiated capture while
 * club_settings.payment_provider = 'simulated'. The "hosted page" is our own
 * /checkout/[orderRef] route, clearly labelled a test gateway.
 */
export const simulatedProvider: PaymentProvider = {
  mode: 'simulated',

  async createOrder(input) {
    const orderRef = `SIM-${input.periodLabel}-${randomBytes(6).toString('hex').toUpperCase()}`
    return { orderRef, approveUrl: `/checkout/${orderRef}` }
  },

  async captureOrder(orderRef, opts) {
    if (opts?.simulateOutcome === 'declined') {
      return { status: 'declined', reason: 'Simulated decline (test gateway)' }
    }
    return {
      status: 'completed',
      captureRef: `SIMCAP-${randomBytes(8).toString('hex').toUpperCase()}`,
    }
  },
}
