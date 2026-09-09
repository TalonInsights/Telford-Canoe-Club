-- 0025 — the shop's master switch, enforced where it counts.
--
-- 0024 added `club_settings.shop_open`. A switch that only hides the page is
-- not a switch: the basket and payment functions must refuse too, or a stale
-- tab could still order kit the club is not selling. Same reasoning as the
-- payment-mode gate in 0023.

create or replace function merch_add_to_basket(
  p_product_id uuid,
  p_size text default null,
  p_quantity int default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p merch_products%rowtype;
  basket_id uuid;
  chosen text := nullif(trim(coalesce(p_size, '')), '');
  open_now boolean;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'choose between 1 and 20';
  end if;

  select shop_open into open_now from club_settings where id;
  if not coalesce(open_now, true) then
    raise exception 'the club shop is closed at the moment';
  end if;

  select * into p from merch_products where id = p_product_id;
  if not found or not p.is_active then
    raise exception 'that item is not on sale';
  end if;

  if array_length(p.sizes, 1) is null then
    chosen := null;
  elsif chosen is null or not (chosen = any (p.sizes)) then
    raise exception 'choose a size';
  end if;

  basket_id := merch_my_basket();

  insert into merch_order_items (
    order_id, product_id, product_name, size, quantity, unit_price_pence
  )
  values (basket_id, p.id, p.name, chosen, p_quantity, p.price_pence)
  on conflict (order_id, product_id, coalesce(size, '')) do update
    set quantity = least(merch_order_items.quantity + excluded.quantity, 20),
        unit_price_pence = excluded.unit_price_pence,
        product_name = excluded.product_name;

  perform merch_recalculate_total(basket_id);
  return basket_id;
end;
$$;

create or replace function begin_merch_payment(p_order_id uuid, p_order_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  o merch_orders%rowtype;
  mode text;
  open_now boolean;
  line_count int;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  if p_order_ref is null or length(trim(p_order_ref)) < 8 then
    raise exception 'invalid order reference';
  end if;

  select payment_provider, shop_open into mode, open_now from club_settings where id;
  if not coalesce(open_now, true) then
    raise exception 'the club shop is closed at the moment';
  end if;
  if mode = 'off' then
    raise exception 'online payment is switched off, speak to the treasurer';
  end if;

  select * into o from merch_orders where id = p_order_id;
  if not found or o.user_id <> uid then
    raise exception 'order not found';
  end if;
  if o.status <> 'draft' and o.status <> 'pending' then
    raise exception 'that order has already been paid';
  end if;

  select count(*) into line_count from merch_order_items where order_id = o.id;
  if line_count = 0 then
    raise exception 'your basket is empty';
  end if;

  if merch_recalculate_total(o.id) <= 0 then
    raise exception 'nothing to pay';
  end if;

  update merch_orders
  set status = 'pending', order_ref = p_order_ref, source = 'paypal'
  where id = o.id;

  perform audit('merch.order_created', 'merch_orders', o.id,
    jsonb_build_object('status', o.status, 'previous_order', o.order_ref),
    jsonb_build_object('order_ref', p_order_ref, 'gateway', mode));
end;
$$;
