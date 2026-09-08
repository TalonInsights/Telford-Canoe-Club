-- 0023 — club merchandise: products, a basket, orders and fulfilment
-- (client order 8 Sep 2026: members order club kit, admins see the orders
-- through to handing them over, paying through the same simulated gateway as
-- membership).
--
-- Deliberately its OWN tables rather than a reuse of `memberships`:
--   * `memberships` carries a promotion trigger that turns a payer into a
--     `member`. Buying a beanie must never grant membership.
--   * A membership is one row a year; an order is a basket of lines.
--
-- What it copies exactly from 0018, because those decisions were right:
--   * every state change goes through a security-definer function, so there
--     is no member-facing insert or update policy on the order tables;
--   * `order_ref` and `capture_ref` are both unique, which is what makes
--     idempotency enforceable rather than merely attempted;
--   * in `complete_merch_payment` the guard order is ownership, then
--     replay-returns-success, then status, then the payment-mode gate, and
--     that gate is written as a denial of everything except 'simulated' so a
--     future provider is closed by default;
--   * prices are read from the products table inside the database. Nothing
--     about money is ever taken from the browser.

/* ----------------------------------------------------------------- products */

create table if not exists merch_products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique,
  name text not null,
  description text,
  price_pence int not null check (price_pence >= 0),
  -- Photographs follow (client note); until then the card draws the badge.
  image_path text,
  -- Empty array means one size fits all; otherwise the chosen size must be
  -- one of these, checked in the database when the line is added.
  sizes text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  stock_note text
);

drop trigger if exists merch_products_updated_at on merch_products;
create trigger merch_products_updated_at
  before update on merch_products
  for each row execute function set_updated_at();

alter table merch_products enable row level security;

drop policy if exists merch_products_read on merch_products;
create policy merch_products_read on merch_products for select using (true);

drop policy if exists merch_products_committee_all on merch_products;
create policy merch_products_committee_all on merch_products
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

/* ------------------------------------------------------------------- orders */

create table if not exists merch_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  user_id uuid not null references profiles (user_id),
  -- draft = the member's basket. Everything from 'pending' on is a real order.
  status text not null default 'draft' check (
    status in ('draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded')
  ),
  total_pence int not null default 0 check (total_pence >= 0),
  order_ref text unique,
  capture_ref text unique,
  paid_at timestamptz,
  source payment_source,
  member_note text,
  fulfilled_at timestamptz,
  fulfilled_by uuid references profiles (user_id),
  committee_note text
);

-- One basket per person; finished orders are unlimited.
create unique index if not exists merch_orders_one_draft
  on merch_orders (user_id) where status = 'draft';

create index if not exists merch_orders_status
  on merch_orders (status, created_at desc);

drop trigger if exists merch_orders_updated_at on merch_orders;
create trigger merch_orders_updated_at
  before update on merch_orders
  for each row execute function set_updated_at();

alter table merch_orders enable row level security;

-- Read your own, or anything if you run the club. No member write policy at
-- all: the definer functions below are the only way an order changes.
drop policy if exists merch_orders_select_own on merch_orders;
create policy merch_orders_select_own on merch_orders
  for select using (user_id = auth.uid());

drop policy if exists merch_orders_committee_all on merch_orders;
create policy merch_orders_committee_all on merch_orders
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

/* -------------------------------------------------------------- order lines */

create table if not exists merch_order_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references merch_orders (id) on delete cascade,
  product_id uuid not null references merch_products (id),
  -- Snapshots: a later rename or price change must not rewrite history.
  product_name text not null,
  size text,
  quantity int not null check (quantity between 1 and 20),
  unit_price_pence int not null check (unit_price_pence >= 0)
);

-- The same product in the same size is one line whose quantity grows.
create unique index if not exists merch_order_items_unique_line
  on merch_order_items (order_id, product_id, coalesce(size, ''));

alter table merch_order_items enable row level security;

-- Decision 8 of this project: a policy that reads another policed table
-- recurses. Ownership is answered by a definer helper instead.
create or replace function merch_order_is_mine(p_order_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from merch_orders o where o.id = p_order_id and o.user_id = p_uid
  );
$$;

drop policy if exists merch_order_items_select on merch_order_items;
create policy merch_order_items_select on merch_order_items
  for select using (
    merch_order_is_mine(order_id, auth.uid()) or has_role(auth.uid(), 'committee')
  );

drop policy if exists merch_order_items_committee_all on merch_order_items;
create policy merch_order_items_committee_all on merch_order_items
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

/* ---------------------------------------------------------------- the basket */

-- Recalculate a total from its lines. Called after every basket change so the
-- stored total can never drift from the lines it is made of.
create or replace function merch_recalculate_total(p_order_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
begin
  select coalesce(sum(quantity * unit_price_pence), 0) into total
  from merch_order_items where order_id = p_order_id;

  update merch_orders set total_pence = total where id = p_order_id;
  return total;
end;
$$;

-- Find the caller's basket, creating one on first use.
create or replace function merch_my_basket()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  basket_id uuid;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select id into basket_id from merch_orders
  where user_id = uid and status = 'draft';

  if basket_id is null then
    insert into merch_orders (user_id, status) values (uid, 'draft')
    returning id into basket_id;
  end if;

  return basket_id;
end;
$$;

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
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'choose between 1 and 20';
  end if;

  select * into p from merch_products where id = p_product_id;
  if not found or not p.is_active then
    raise exception 'that item is not on sale';
  end if;

  -- Size is checked against the product, not trusted from the form.
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
        -- Re-snapshot the price: the basket always shows today's price.
        unit_price_pence = excluded.unit_price_pence,
        product_name = excluded.product_name;

  perform merch_recalculate_total(basket_id);
  return basket_id;
end;
$$;

create or replace function merch_set_item_quantity(p_item_id uuid, p_quantity int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  order_id_v uuid;
  order_status text;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select i.order_id, o.status into order_id_v, order_status
  from merch_order_items i
  join merch_orders o on o.id = i.order_id
  where i.id = p_item_id and o.user_id = uid;

  if order_id_v is null then
    raise exception 'item not found';
  end if;
  if order_status <> 'draft' then
    raise exception 'that order has already been placed';
  end if;

  if p_quantity is null or p_quantity < 1 then
    delete from merch_order_items where id = p_item_id;
  elsif p_quantity > 20 then
    raise exception 'choose between 1 and 20';
  else
    update merch_order_items set quantity = p_quantity where id = p_item_id;
  end if;

  return merch_recalculate_total(order_id_v);
end;
$$;

/* ------------------------------------------------------------------ payment */

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
  line_count int;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  if p_order_ref is null or length(trim(p_order_ref)) < 8 then
    raise exception 'invalid order reference';
  end if;

  select payment_provider into mode from club_settings where id;
  if mode = 'off' then
    raise exception 'online payment is switched off, speak to the treasurer';
  end if;

  select * into o from merch_orders where id = p_order_id;
  -- Wrong id and someone else's id give the same answer: no enumeration.
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

  -- Recompute rather than trust the stored total or anything from the client.
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

create or replace function complete_merch_payment(p_order_ref text, p_capture_ref text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  o merch_orders%rowtype;
  mode text;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select * into o from merch_orders where order_ref = p_order_ref;
  if not found or o.user_id <> uid then
    raise exception 'order not found';
  end if;

  -- Replay first, before any other judgement: a double click or a refresh
  -- must get the same answer as the click that worked.
  if o.status in ('paid', 'fulfilled') and o.capture_ref = p_capture_ref then
    return o.id;
  end if;
  if o.status in ('paid', 'fulfilled') then
    raise exception 'this order is already paid';
  end if;
  if o.status <> 'pending' then
    raise exception 'this order can no longer be paid';
  end if;

  -- The gate. A denial of everything except the one safe mode, so a provider
  -- added later is closed until somebody deliberately opens it.
  select payment_provider into mode from club_settings where id;
  if mode <> 'simulated' then
    raise exception 'captures are verified with the payment provider, this route is only for the simulated gateway';
  end if;
  if p_capture_ref is null or length(trim(p_capture_ref)) < 8 then
    raise exception 'invalid capture reference';
  end if;

  update merch_orders
  set status = 'paid', capture_ref = p_capture_ref, paid_at = now()
  where id = o.id;

  perform audit('merch.paid_online', 'merch_orders', o.id,
    jsonb_build_object('status', o.status),
    jsonb_build_object('status', 'paid', 'capture_ref', p_capture_ref,
                       'total_pence', o.total_pence, 'gateway', 'simulated'));

  return o.id;
end;
$$;

create or replace function abandon_merch_payment(p_order_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  o merch_orders%rowtype;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select * into o from merch_orders where order_ref = p_order_ref;
  if not found or o.user_id <> uid then
    raise exception 'order not found';
  end if;
  if o.status <> 'pending' then
    raise exception 'that order can no longer be changed';
  end if;

  -- Back to a basket, with the lines intact, so nothing is lost by backing out.
  update merch_orders
  set status = 'draft', order_ref = null, source = null
  where id = o.id;

  perform audit('merch.order_abandoned', 'merch_orders', o.id,
    jsonb_build_object('order_ref', p_order_ref), null);
end;
$$;

/* -------------------------------------------------------- committee actions */

-- Record an order paid in cash or by bank transfer at the club, the merch twin
-- of recordPaymentAction for memberships.
create or replace function merch_record_manual_payment(
  p_order_id uuid,
  p_source payment_source,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o merch_orders%rowtype;
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;
  if p_source not in ('manual_bank', 'manual_cash', 'complimentary') then
    raise exception 'that is not a manual payment method';
  end if;

  select * into o from merch_orders where id = p_order_id;
  if not found then
    raise exception 'order not found';
  end if;
  if o.status not in ('draft', 'pending') then
    raise exception 'that order is already paid';
  end if;
  if merch_recalculate_total(o.id) <= 0 and p_source <> 'complimentary' then
    raise exception 'that order is empty';
  end if;

  update merch_orders
  set status = 'paid', source = p_source, paid_at = now(),
      committee_note = coalesce(p_note, committee_note)
  where id = o.id;

  perform audit('merch.payment_recorded', 'merch_orders', o.id,
    jsonb_build_object('status', o.status),
    jsonb_build_object('status', 'paid', 'source', p_source));

  return o.id;
end;
$$;

create or replace function merch_set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o merch_orders%rowtype;
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;
  if p_status not in ('paid', 'fulfilled', 'cancelled', 'refunded') then
    raise exception 'unknown order status';
  end if;

  select * into o from merch_orders where id = p_order_id;
  if not found then
    raise exception 'order not found';
  end if;
  if o.status = 'draft' then
    raise exception 'that order is still a basket, it has not been placed';
  end if;

  update merch_orders
  set status = p_status,
      committee_note = coalesce(p_note, committee_note),
      fulfilled_at = case when p_status = 'fulfilled' then now() else null end,
      fulfilled_by = case when p_status = 'fulfilled' then auth.uid() else null end
  where id = o.id;

  perform audit('merch.status_changed', 'merch_orders', o.id,
    jsonb_build_object('status', o.status),
    jsonb_build_object('status', p_status));

  return o.id;
end;
$$;

/* -------------------------------------------------------------- the two SKUs */

-- The worked examples from the client order. Photographs follow, so
-- `image_path` stays null and the card falls back to the club badge.
insert into merch_products (slug, name, description, price_pence, sizes, sort_order)
values
  ('club-beanie', 'Club beanie',
   'Warm ribbed beanie with the club badge, one size. The thing you will actually wear on a January get-in.',
   1200, '{}', 1),
  ('club-hoodie', 'Club hoodie',
   'Heavyweight hooded top with the club badge on the chest. Sized generously to go over a base layer.',
   3000, '{XS,S,M,L,XL,XXL}', 2)
on conflict (slug) do nothing;
