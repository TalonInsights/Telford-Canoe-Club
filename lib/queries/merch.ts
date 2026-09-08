import { getAuthUser } from '@/lib/auth/guards'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/queries/helpers'

export type MerchProduct = Tables<'merch_products'>
export type MerchOrderRow = Tables<'merch_orders'>
export type MerchOrderItem = Tables<'merch_order_items'>

export type MerchOrder = MerchOrderRow & { items: MerchOrderItem[] }

/** An order with the person attached, for the committee's fulfilment queue. */
export type AdminMerchOrder = MerchOrder & {
  buyer: { name: string; email: string | null; phone: string | null } | null
}

const ITEM_COLUMNS = 'id, order_id, product_id, product_name, size, quantity, unit_price_pence'

export async function getProducts(options?: { includeInactive?: boolean }): Promise<MerchProduct[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  let query = supabase.from('merch_products').select('*').order('sort_order', { ascending: true })
  if (!options?.includeInactive) query = query.eq('is_active', true)
  const { data } = await query
  return data ?? []
}

export async function getProductById(id: string): Promise<MerchProduct | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('merch_products').select('*').eq('id', id).maybeSingle()
  return data
}

/**
 * The signed-in member's basket, or null if they have not started one. Scoped
 * explicitly by user id rather than leaning on RLS alone, so a query that ever
 * ran with a wider policy still could not hand back somebody else's basket.
 */
export async function getMyBasket(): Promise<MerchOrder | null> {
  if (!isSupabaseConfigured()) return null
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('merch_orders')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .maybeSingle()
  if (!order) return null

  const { data: items } = await supabase
    .from('merch_order_items')
    .select(ITEM_COLUMNS)
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  return { ...order, items: (items ?? []) as MerchOrderItem[] }
}

/** Everything the member has actually placed, newest first. */
export async function getMyOrders(): Promise<MerchOrder[]> {
  if (!isSupabaseConfigured()) return []
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('merch_orders')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (!orders || orders.length === 0) return []

  const { data: items } = await supabase
    .from('merch_order_items')
    .select(ITEM_COLUMNS)
    .in(
      'order_id',
      orders.map((o) => o.id)
    )
  return attachItems(orders, (items ?? []) as MerchOrderItem[])
}

export async function getOrderByRef(orderRef: string): Promise<MerchOrder | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('merch_orders')
    .select('*')
    .eq('order_ref', orderRef)
    .maybeSingle()
  if (!order) return null

  const { data: items } = await supabase
    .from('merch_order_items')
    .select(ITEM_COLUMNS)
    .eq('order_id', order.id)
  return { ...order, items: (items ?? []) as MerchOrderItem[] }
}

/** The committee's queue: every placed order, with who placed it. */
export async function getAdminOrders(): Promise<AdminMerchOrder[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('merch_orders')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (!orders || orders.length === 0) return []

  const orderIds = orders.map((o) => o.id)
  const userIds = [...new Set(orders.map((o) => o.user_id))]

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase.from('merch_order_items').select(ITEM_COLUMNS).in('order_id', orderIds),
    supabase.from('profiles').select('user_id, first_name, last_name, email, phone').in('user_id', userIds),
  ])

  const buyers = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      {
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Member',
        email: p.email,
        phone: p.phone,
      },
    ])
  )

  return attachItems(orders, (items ?? []) as MerchOrderItem[]).map((order) => ({
    ...order,
    buyer: buyers.get(order.user_id) ?? null,
  }))
}

function attachItems<T extends MerchOrderRow>(
  orders: T[],
  items: MerchOrderItem[]
): (T & { items: MerchOrderItem[] })[] {
  const byOrder = new Map<string, MerchOrderItem[]>()
  for (const item of items) {
    byOrder.set(item.order_id, [...(byOrder.get(item.order_id) ?? []), item])
  }
  return orders.map((order) => ({ ...order, items: byOrder.get(order.id) ?? [] }))
}
