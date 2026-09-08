/**
 * The words and tones the shop uses for an order, in one place so a member's
 * "my orders" list and the committee's fulfilment queue can never describe the
 * same order differently.
 */

export const merchStatuses = [
  'draft',
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
] as const

export type MerchStatus = (typeof merchStatuses)[number]

/** What the committee sees. */
export const merchStatusLabels: Record<MerchStatus, string> = {
  draft: 'Basket',
  pending: 'Awaiting payment',
  paid: 'Paid, to hand over',
  fulfilled: 'Handed over',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

/** What the member sees, which is the same fact from their side of the counter. */
export const merchStatusForMember: Record<MerchStatus, string> = {
  draft: 'In your basket',
  pending: 'Payment not finished',
  paid: 'Paid, ready to collect',
  fulfilled: 'Collected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const merchStatusTone: Record<MerchStatus, 'neutral' | 'success' | 'warn'> = {
  draft: 'neutral',
  pending: 'warn',
  paid: 'success',
  fulfilled: 'neutral',
  cancelled: 'neutral',
  refunded: 'warn',
}

export function merchStatusLabel(status: string): string {
  return merchStatusLabels[status as MerchStatus] ?? status
}

export function merchMemberStatusLabel(status: string): string {
  return merchStatusForMember[status as MerchStatus] ?? status
}

/** The orders the committee still has something to do about. */
export const OPEN_ORDER_STATUSES: MerchStatus[] = ['pending', 'paid']

export function orderLineSummary(
  items: { product_name: string; size: string | null; quantity: number }[]
): string {
  if (items.length === 0) return 'Nothing in it yet'
  return items
    .map((i) => `${i.quantity} × ${i.product_name}${i.size ? ` (${i.size})` : ''}`)
    .join(', ')
}
