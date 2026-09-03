-- 0018 — the online payment machine (P4-01..03, P4-07, P4-08, P9-07/08 data
-- side). A SIMULATED gateway stands in for PayPal until D1 is answered; the
-- switch is club_settings.payment_provider and it is enforced HERE, in the
-- database, not just in the UI:
--
--   off       — online payment hidden; treasurer bank/cash only
--   simulated — /checkout/[ref] test gateway; complete_online_payment()
--               honours a caller-initiated capture (no money moves)
--   paypal    — complete_online_payment() REFUSES self-capture; activation
--               then only happens after a server-verified PayPal capture
--               (webhook / service-role path). Flipping the setting closes
--               the simulation door instantly, everywhere.
--
-- Order state rides on the membership row itself (paypal_order_id /
-- paypal_capture_id, §5.2) — the same columns real PayPal writes later.

-- ---------------------------------------------------------------- settings
alter table club_settings
  add column payment_provider text not null default 'simulated'
    check (payment_provider in ('off', 'simulated', 'paypal'));

-- A next period so renewal logic is real (dates = calendar year until D2 is
-- answered; adjusting dates later does not touch memberships).
insert into membership_periods (label, starts_on, ends_on, is_current)
values ('2027', '2027-01-01', '2027-12-31', false)
on conflict (label) do nothing;

-- ------------------------------------------------- request (now renewable)
-- p_period_id lets a member request NEXT year while this year is active
-- (renewal, P4-05). Signature change → drop first; an overload would be
-- ambiguous through PostgREST.
drop function if exists request_membership(membership_tier, text[]);

create or replace function request_membership(
  p_tier membership_tier,
  p_family_names text[] default '{}',
  p_period_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  period uuid;
  amount int;
  mem uuid;
  me record;
  fname text;
begin
  if uid is null then
    raise exception 'sign in to request a membership';
  end if;

  if p_period_id is null then
    select id into period from membership_periods where is_current;
  else
    select id into period from membership_periods where id = p_period_id;
  end if;
  if period is null then
    raise exception 'no such membership period';
  end if;

  if exists (
    select 1 from memberships m
    where m.period_id = period and m.status = 'active'
      and (m.primary_user_id = uid
           or exists (select 1 from membership_members mm where mm.membership_id = m.id and mm.user_id = uid))
  ) then
    raise exception 'you already have an active membership for this period';
  end if;

  select case p_tier
           when 'adult' then price_adult_pence
           when 'junior' then price_junior_pence
           else price_family_pence
         end
  into amount from club_settings where id;

  select first_name, last_name, date_of_birth into me from profiles where user_id = uid;

  select id into mem from memberships
  where period_id = period and primary_user_id = uid and status = 'pending';

  if mem is not null then
    delete from membership_members where membership_id = mem;
    update memberships
    set tier = p_tier, amount_pence = amount, source = 'manual_bank',
        paypal_order_id = null, paypal_capture_id = null
    where id = mem;
  else
    insert into memberships (period_id, tier, status, primary_user_id, amount_pence, source)
    values (period, p_tier, 'pending', uid, amount, 'manual_bank')
    returning id into mem;
  end if;

  insert into membership_members (membership_id, user_id, display_name, is_junior)
  values (mem, uid, trim(coalesce(me.first_name, '') || ' ' || coalesce(me.last_name, '')), is_junior(me.date_of_birth));

  if p_tier = 'family' then
    foreach fname in array coalesce(p_family_names, '{}') loop
      if length(trim(fname)) > 0
         and lower(trim(fname)) <> lower(trim(coalesce(me.first_name, '') || ' ' || coalesce(me.last_name, ''))) then
        insert into membership_members (membership_id, display_name)
        values (mem, trim(fname))
        on conflict do nothing;
      end if;
    end loop;
  end if;

  perform audit('membership.requested', 'memberships', mem, null,
    jsonb_build_object('tier', p_tier, 'amount_pence', amount, 'period_id', period));

  return mem;
end;
$$;

-- ------------------------------------------------------- online: begin
-- Stamps a pending membership with the gateway order ref. Re-callable
-- (retry after a decline replaces the ref). Owner-only; refuses when
-- online payment is switched off.
create or replace function begin_online_payment(p_membership_id uuid, p_order_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mode text;
  m record;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  if p_order_ref is null or length(trim(p_order_ref)) < 8 then
    raise exception 'invalid order reference';
  end if;

  select payment_provider into mode from club_settings where id;
  if mode = 'off' then
    raise exception 'online payment is switched off — pay the treasurer directly';
  end if;

  select * into m from memberships where id = p_membership_id;
  if not found or m.primary_user_id <> uid then
    raise exception 'membership not found';
  end if;
  if m.status <> 'pending' then
    raise exception 'only a pending membership can be paid online';
  end if;

  update memberships
  set source = 'paypal', paypal_order_id = p_order_ref
  where id = p_membership_id;

  perform audit('payment.order_created', 'memberships', p_membership_id,
    jsonb_build_object('source', m.source, 'previous_order', m.paypal_order_id),
    jsonb_build_object('order_ref', p_order_ref, 'gateway', mode));
end;
$$;

-- ------------------------------------------------------ online: capture
-- THE mode-gated activation. In 'simulated' mode the payer's own capture
-- call activates (that IS the simulation). In 'paypal' mode it refuses —
-- real captures are recorded by the server after PayPal confirms
-- (webhook / service-role), never on the browser's say-so. Idempotent on
-- the capture ref.
create or replace function complete_online_payment(p_order_ref text, p_capture_ref text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mode text;
  m record;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select * into m from memberships where paypal_order_id = p_order_ref;
  if not found or m.primary_user_id <> uid then
    raise exception 'order not found';
  end if;

  -- replayed success (double-click, refresh): same capture → same answer
  if m.status = 'active' and m.paypal_capture_id = p_capture_ref then
    return m.id;
  end if;
  if m.status = 'active' then
    raise exception 'this membership is already active';
  end if;
  if m.status <> 'pending' then
    raise exception 'this order can no longer be paid';
  end if;

  select payment_provider into mode from club_settings where id;
  if mode <> 'simulated' then
    raise exception 'captures are verified with the payment provider — this route is only for the simulated gateway';
  end if;
  if p_capture_ref is null or length(trim(p_capture_ref)) < 8 then
    raise exception 'invalid capture reference';
  end if;

  update memberships
  set status = 'active', paid_at = now(), paypal_capture_id = p_capture_ref
  where id = m.id;

  perform audit('membership.paid_online', 'memberships', m.id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'active', 'capture_ref', p_capture_ref, 'gateway', 'simulated'));

  return m.id;
end;
$$;

-- ------------------------------------------------------ online: abandon
-- "Cancel and return" on the gateway: back to the treasurer path. The
-- pending row (and the admin queue entry) survives.
create or replace function abandon_online_payment(p_order_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m record;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  select * into m from memberships where paypal_order_id = p_order_ref;
  if not found or m.primary_user_id <> uid then
    raise exception 'order not found';
  end if;
  if m.status = 'active' then
    raise exception 'this membership is already active';
  end if;
  update memberships
  set source = 'manual_bank', paypal_order_id = null
  where id = m.id;
  perform audit('payment.order_abandoned', 'memberships', m.id,
    jsonb_build_object('order_ref', p_order_ref), jsonb_build_object('source', 'manual_bank'));
end;
$$;

-- --------------------------------------------- admin: create membership
-- P9-07 — grant a membership to an existing account (walk-up cash payer,
-- imported member). Activates an existing pending row for that user+period
-- rather than stacking a second one. Committee only.
create or replace function admin_create_membership(
  p_user_id uuid,
  p_tier membership_tier,
  p_period_id uuid,
  p_source payment_source,
  p_amount_pence int default null,
  p_activate boolean default true,
  p_note text default null,
  p_family_names text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  amount int := p_amount_pence;
  mem uuid;
  target record;
  fname text;
  self_name text;
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;

  select first_name, last_name, date_of_birth into target from profiles where user_id = p_user_id;
  if not found then
    raise exception 'no such account';
  end if;
  if not exists (select 1 from membership_periods where id = p_period_id) then
    raise exception 'no such membership period';
  end if;
  if exists (
    select 1 from memberships m
    where m.period_id = p_period_id and m.status = 'active'
      and (m.primary_user_id = p_user_id
           or exists (select 1 from membership_members mm where mm.membership_id = m.id and mm.user_id = p_user_id))
  ) then
    raise exception 'they already have an active membership for this period';
  end if;

  if amount is null then
    select case p_tier
             when 'adult' then price_adult_pence
             when 'junior' then price_junior_pence
             else price_family_pence
           end
    into amount from club_settings where id;
  end if;
  if p_source = 'complimentary' then
    amount := coalesce(p_amount_pence, 0);
  end if;

  select id into mem from memberships
  where period_id = p_period_id and primary_user_id = p_user_id and status = 'pending';

  if mem is not null then
    delete from membership_members where membership_id = mem;
    update memberships
    set tier = p_tier, amount_pence = amount, source = p_source,
        notes = coalesce(p_note, notes), recorded_by = auth.uid(),
        paypal_order_id = null, paypal_capture_id = null,
        status = case when p_activate then 'active' else 'pending' end::membership_status,
        paid_at = case when p_activate then now() else null end
    where id = mem;
  else
    insert into memberships
      (period_id, tier, status, primary_user_id, amount_pence, source, paid_at, recorded_by, notes)
    values
      (p_period_id, p_tier,
       case when p_activate then 'active' else 'pending' end::membership_status,
       p_user_id, amount, p_source,
       case when p_activate then now() else null end,
       auth.uid(), p_note)
    returning id into mem;
  end if;

  self_name := trim(coalesce(target.first_name, '') || ' ' || coalesce(target.last_name, ''));
  insert into membership_members (membership_id, user_id, display_name, is_junior)
  values (mem, p_user_id, self_name, is_junior(target.date_of_birth));

  if p_tier = 'family' then
    foreach fname in array coalesce(p_family_names, '{}') loop
      if length(trim(fname)) > 0 and lower(trim(fname)) <> lower(self_name) then
        insert into membership_members (membership_id, display_name)
        values (mem, trim(fname))
        on conflict do nothing;
      end if;
    end loop;
  end if;

  perform audit('membership.admin_created', 'memberships', mem, null,
    jsonb_build_object('user_id', p_user_id, 'tier', p_tier, 'source', p_source,
                       'amount_pence', amount, 'activated', p_activate));

  return mem;
end;
$$;

-- ------------------------------------------------------- admin: extend
-- P4-07 — goodwill extension into the next period: an active complimentary
-- clone (covered names included) at £0. Committee only.
create or replace function admin_extend_membership(p_membership_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  cur_period record;
  next_period record;
  new_mem uuid;
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;

  select * into m from memberships where id = p_membership_id;
  if not found then
    raise exception 'membership not found';
  end if;
  select * into cur_period from membership_periods where id = m.period_id;
  select * into next_period from membership_periods
  where starts_on > cur_period.ends_on order by starts_on limit 1;
  if not found then
    raise exception 'no later membership period exists yet';
  end if;
  if exists (
    select 1 from memberships e
    where e.period_id = next_period.id and e.primary_user_id = m.primary_user_id
      and e.status = 'active'
  ) then
    raise exception 'they already have an active membership for %', next_period.label;
  end if;

  insert into memberships
    (period_id, tier, status, primary_user_id, amount_pence, source, paid_at, recorded_by, notes)
  values
    (next_period.id, m.tier, 'active', m.primary_user_id, 0, 'complimentary', now(), auth.uid(),
     coalesce(p_note, 'Extended by the committee'))
  returning id into new_mem;

  insert into membership_members (membership_id, user_id, display_name, is_junior)
  select new_mem, mm.user_id, mm.display_name, mm.is_junior
  from membership_members mm where mm.membership_id = m.id;

  perform audit('membership.extended', 'memberships', new_mem,
    jsonb_build_object('from_membership', m.id, 'from_period', cur_period.label),
    jsonb_build_object('to_period', next_period.label));

  return new_mem;
end;
$$;

-- -------------------------------------------------------- expiry sweep
-- P4-08 — time does the authorising: marks date-expired active rows and
-- moves is_current to the period containing today. Idempotent and
-- outcome-determined by the calendar, so a stray caller can only make the
-- data MORE correct; the cron route is just its scheduler.
create or replace function run_expiry_sweep()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count int := 0;
  flipped boolean := false;
  cur record;
  target record;
begin
  update memberships m
  set status = 'expired'
  from membership_periods p
  where p.id = m.period_id and m.status = 'active' and p.ends_on < current_date;
  get diagnostics expired_count = row_count;

  select * into cur from membership_periods where is_current;
  select * into target from membership_periods
  where starts_on <= current_date and ends_on >= current_date
  order by starts_on desc limit 1;

  if target.id is not null and (cur.id is null or cur.id <> target.id) then
    update membership_periods set is_current = false where is_current;
    update membership_periods set is_current = true where id = target.id;
    flipped := true;
  end if;

  if expired_count > 0 or flipped then
    perform audit('membership.expiry_sweep', 'memberships', null, null,
      jsonb_build_object('expired', expired_count, 'period_flipped', flipped));
  end if;

  return jsonb_build_object('expired', expired_count, 'period_flipped', flipped);
end;
$$;
