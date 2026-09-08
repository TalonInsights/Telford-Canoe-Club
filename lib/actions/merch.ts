'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getSession, requireRole } from '@/lib/auth/guards'
import { getClubSettings } from '@/lib/queries/settings'
import { isOnlinePaymentOn } from '@/lib/payments/mode'
import { getPaymentProvider } from '@/lib/payments/provider'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/configured'
import { orderLineSummary } from '@/lib/merch/labels'
import type { ActionResult } from '@/lib/actions/auth'
import type { CheckoutResult } from '@/lib/actions/payments'

/**
 * The club shop. Every basket and order change goes through a database
 * function (0023), never a direct write: the order tables have no member-facing
 * insert or update policy, so prices and totals cannot be argued with from the
 * browser. These actions are the thin, validating layer above them.
 */

const ORDER_REF = /^[A-Z0-9-]{8,64}$/i

function revalidateShop() {
  revalidatePath('/members/shop')
  revalidatePath('/members/shop/orders')
  revalidatePath('/admin/shop')
}

/* -------------------------------------------------------------- the basket */

const addSchema = z.object({
  productId: z.uuid(),
  size: z.string().trim().max(16).optional().nullable(),
  quantity: z.number().int().min(1).max(20).default(1),
})

export async function addToBasketAction(input: z.input<typeof addSchema>): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in to order club kit' }

  const parsed = addSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check your choices' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('merch_add_to_basket', {
    p_product_id: parsed.data.productId,
    p_size: parsed.data.size || undefined,
    p_quantity: parsed.data.quantity,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, message: 'Added to your basket' }
}

export async function setBasketItemQuantityAction(input: {
  itemId: string
  quantity: number
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  if (!z.uuid().safeParse(input.itemId).success) return { ok: false, message: 'Unknown item' }
  if (!Number.isInteger(input.quantity) || input.quantity < 0 || input.quantity > 20) {
    return { ok: false, message: 'Choose between 1 and 20' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('merch_set_item_quantity', {
    p_item_id: input.itemId,
    p_quantity: input.quantity,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, message: input.quantity === 0 ? 'Removed' : 'Basket updated' }
}

/* ------------------------------------------------------------------ paying */

export async function startShopCheckoutAction(orderId: string): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  if (!z.uuid().safeParse(orderId).success) return { ok: false, message: 'Unknown order' }

  const settings = await getClubSettings()
  if (!isOnlinePaymentOn(settings.paymentProvider)) {
    return { ok: false, message: 'Online payment is switched off, speak to the treasurer' }
  }
  const provider = getPaymentProvider(settings.paymentProvider)
  if (!provider) return { ok: false, message: 'Online payment is switched off' }

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('merch_orders')
    .select('id, status, total_pence, user_id')
    .eq('id', orderId)
    .maybeSingle()
  if (!order || order.user_id !== session.userId) return { ok: false, message: 'Order not found' }
  if (order.status !== 'draft' && order.status !== 'pending') {
    return { ok: false, message: 'That order has already been paid' }
  }

  const { data: items } = await supabase
    .from('merch_order_items')
    .select('product_name, size, quantity')
    .eq('order_id', order.id)
  if (!items || items.length === 0) return { ok: false, message: 'Your basket is empty' }

  let created
  try {
    created = await provider.createMerchOrder({
      orderId: order.id,
      userId: session.userId,
      amountPence: order.total_pence,
      description: `Telford Canoe Club shop: ${orderLineSummary(items)}`,
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'The payment gateway did not respond',
    }
  }

  // The database re-checks ownership, the basket contents and the total, and
  // recomputes the amount from the lines before it accepts the reference.
  const { error } = await supabase.rpc('begin_merch_payment', {
    p_order_id: order.id,
    p_order_ref: created.orderRef,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, redirect: created.approveUrl }
}

export async function captureShopOrderAction(
  orderRef: string,
  outcome: 'approve' | 'decline'
): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  if (!ORDER_REF.test(orderRef)) return { ok: false, message: 'Unknown order' }

  const settings = await getClubSettings()
  const provider = getPaymentProvider(settings.paymentProvider)
  if (!provider) return { ok: false, message: 'Online payment is switched off' }

  const capture = await provider.captureOrder(orderRef, {
    simulateOutcome: outcome === 'decline' ? 'declined' : 'completed',
  })

  const supabase = await createClient()

  if (capture.status === 'declined') {
    const { data: order } = await supabase
      .from('merch_orders')
      .select('id')
      .eq('order_ref', orderRef)
      .maybeSingle()
    if (order) {
      await supabase.rpc('audit', {
        p_action: 'merch.capture_declined',
        p_entity: 'merch_orders',
        p_entity_id: order.id,
        p_after: { order_ref: orderRef, reason: capture.reason },
      })
    }
    return { ok: false, declined: true, message: capture.reason }
  }

  const { error } = await supabase.rpc('complete_merch_payment', {
    p_order_ref: orderRef,
    p_capture_ref: capture.captureRef,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, redirect: '/members/shop/orders?paid=1' }
}

export async function abandonShopOrderAction(orderRef: string): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  const session = await getSession()
  if (!session) return { ok: false, message: 'Log in first' }
  if (!ORDER_REF.test(orderRef)) return { ok: false, message: 'Unknown order' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('abandon_merch_payment', { p_order_ref: orderRef })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, redirect: '/members/shop' }
}

/* -------------------------------------------------------- committee actions */

export async function setOrderStatusAction(input: {
  orderId: string
  status: 'paid' | 'fulfilled' | 'cancelled' | 'refunded'
  note?: string
}): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(input.orderId).success) return { ok: false, message: 'Unknown order' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('merch_set_order_status', {
    p_order_id: input.orderId,
    p_status: input.status,
    p_note: input.note?.trim() || undefined,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  const said: Record<string, string> = {
    paid: 'Marked as paid',
    fulfilled: 'Marked as handed over',
    cancelled: 'Order cancelled',
    refunded: 'Marked as refunded',
  }
  return { ok: true, message: said[input.status] ?? 'Order updated' }
}

export async function recordShopPaymentAction(input: {
  orderId: string
  source: 'manual_bank' | 'manual_cash' | 'complimentary'
  note?: string
}): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(input.orderId).success) return { ok: false, message: 'Unknown order' }
  if (!['manual_bank', 'manual_cash', 'complimentary'].includes(input.source)) {
    return { ok: false, message: 'Choose how it was paid' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('merch_record_manual_payment', {
    p_order_id: input.orderId,
    p_source: input.source,
    p_note: input.note?.trim() || undefined,
  })
  if (error) return { ok: false, message: error.message }

  revalidateShop()
  return { ok: true, message: 'Payment recorded' }
}

/* ---------------------------------------------------------------- products */

const productSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens'),
  name: z.string().trim().min(2, 'Give the item a name').max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  pricePence: z.number().int().min(0).max(50_000),
  sizes: z.array(z.string().trim().min(1).max(16)).max(20).default([]),
  imagePath: z.string().max(300).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  stockNote: z.string().trim().max(200).optional().nullable(),
})

export type ProductInput = z.input<typeof productSchema>

export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  await requireRole('committee')
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Check the form' }
  }
  const v = parsed.data

  const supabase = await createClient()
  const row = {
    slug: v.slug,
    name: v.name,
    description: v.description || null,
    price_pence: v.pricePence,
    sizes: v.sizes,
    image_path: v.imagePath || null,
    is_active: v.isActive,
    sort_order: v.sortOrder,
    stock_note: v.stockNote || null,
  }

  if (v.id) {
    const { error } = await supabase.from('merch_products').update(row).eq('id', v.id)
    if (error) {
      return {
        ok: false,
        message: error.code === '23505' ? 'Another item already uses that web name' : error.message,
      }
    }
    await supabase.rpc('audit', {
      p_action: 'merch.product_updated',
      p_entity: 'merch_products',
      p_entity_id: v.id,
      p_after: { name: v.name, price_pence: v.pricePence, is_active: v.isActive },
    })
  } else {
    const { data, error } = await supabase.from('merch_products').insert(row).select('id').single()
    if (error) {
      return {
        ok: false,
        message: error.code === '23505' ? 'Another item already uses that web name' : error.message,
      }
    }
    await supabase.rpc('audit', {
      p_action: 'merch.product_created',
      p_entity: 'merch_products',
      p_entity_id: data.id,
      p_after: { name: v.name, price_pence: v.pricePence },
    })
  }

  revalidateShop()
  return { ok: true, message: v.id ? 'Item saved' : 'Item added to the shop' }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireRole('committee')
  if (!z.uuid().safeParse(id).success) return { ok: false, message: 'Unknown item' }

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('merch_products')
    .select('name')
    .eq('id', id)
    .maybeSingle()
  if (!before) return { ok: false, message: 'Item not found' }

  const { error } = await supabase.from('merch_products').delete().eq('id', id)
  if (error) {
    // An item that has been ordered cannot be deleted: the order lines point at
    // it, and an order's history must stay readable.
    return {
      ok: false,
      message:
        error.code === '23503'
          ? 'Somebody has ordered this, so it cannot be deleted. Switch it off instead.'
          : error.message,
    }
  }

  await supabase.rpc('audit', {
    p_action: 'merch.product_deleted',
    p_entity: 'merch_products',
    p_entity_id: id,
    p_before: { name: before.name },
  })
  revalidateShop()
  return { ok: true, message: `${before.name} removed` }
}
