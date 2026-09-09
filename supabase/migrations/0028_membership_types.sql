-- 0028 — membership types become records the club edits, so a "Half year"
-- type can be created without a developer (change request item 1).
--
-- The hard part is not the catalogue, it is duration. Until now a membership
-- had no end date of its own: it ran to `membership_periods.ends_on`, the
-- club-wide 31 December, and `run_expiry_sweep` expired it on that date. A
-- six-month type bought in June would have been quietly killed off in
-- December no matter what its record said. So memberships gain their own
-- `ends_on`, set once at activation, and expiry honours it.
--
-- What is deliberately NOT done: the `membership_tier` enum is not retired and
-- existing rows are not rewritten. `memberships.tier` stays as a historical
-- stamp, every type declares which enum value to stamp, and every read joins
-- the type LEFT so a deactivated or deleted type can never make an old
-- membership disappear from the records.

create table if not exists membership_types (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique,
  name text not null,
  description text,
  price_pence int not null check (price_pence >= 0),
  -- Null means "runs to the end of the club's membership year", which is how
  -- every membership has worked until now. A number means N months from the
  -- day it is paid for.
  duration_months int check (duration_months is null or (duration_months between 1 and 60)),
  -- Whether buying this covers other people in the household.
  covers_family boolean not null default false,
  -- Which historical tier to stamp on the membership row, so old reports,
  -- filters and the enum column all keep working.
  legacy_tier membership_tier not null default 'adult',
  -- Off hides it from new sign-ups. It never affects anyone already on it.
  is_active boolean not null default true,
  sort_order int not null default 0
);

drop trigger if exists membership_types_updated_at on membership_types;
create trigger membership_types_updated_at
  before update on membership_types
  for each row execute function set_updated_at();

alter table membership_types enable row level security;

-- Prices are public: the join page shows them to anyone.
drop policy if exists membership_types_read on membership_types;
create policy membership_types_read on membership_types for select using (true);

-- Money is an admin matter, matching club_settings.
drop policy if exists membership_types_admin_write on membership_types;
create policy membership_types_admin_write on membership_types
  for all using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

/* ------------------------------------------------ the three existing tiers */

insert into membership_types (slug, name, description, price_pence, duration_months, covers_family, legacy_tier, sort_order)
select * from (values
  ('adult', 'Single adult', 'For paddlers aged 18 and over.',
   (select price_adult_pence from club_settings where id), null::int, false, 'adult'::membership_tier, 1),
  ('junior', 'Junior', 'For paddlers under 18. A parent or guardian completes the details.',
   (select price_junior_pence from club_settings where id), null::int, false, 'junior'::membership_tier, 2),
  ('family', 'Family', 'Everyone at one address, whatever they paddle.',
   (select price_family_pence from club_settings where id), null::int, true, 'family'::membership_tier, 3)
) as seed(slug, name, description, price_pence, duration_months, covers_family, legacy_tier, sort_order)
where not exists (select 1 from membership_types);

/* --------------------------------------------- memberships gain an end date */

alter table memberships
  add column if not exists membership_type_id uuid references membership_types (id),
  add column if not exists ends_on date;

-- Existing rows keep their history: point each at the type that matches the
-- tier it was sold on.
update memberships m
set membership_type_id = t.id
from membership_types t
where m.membership_type_id is null and t.legacy_tier = m.tier and t.slug = m.tier::text;

/* --------------------------------------------- when a membership runs out */

-- Set once, when a membership becomes active, and never recalculated: what a
-- member bought is what they get, even if the type is edited afterwards.
create or replace function set_membership_end_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  months int;
  period_end date;
begin
  if new.status = 'active' and new.ends_on is null then
    select duration_months into months
    from membership_types where id = new.membership_type_id;

    select ends_on into period_end
    from membership_periods where id = new.period_id;

    if months is null then
      -- The club's usual arrangement: runs to the end of the membership year.
      new.ends_on := period_end;
    else
      new.ends_on := (coalesce(new.paid_at, now())::date + (months || ' months')::interval)::date;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists memberships_set_end_date on memberships;
create trigger memberships_set_end_date
  before insert or update on memberships
  for each row execute function set_membership_end_date();

-- Expiry honours the membership's own end date, falling back to the club-wide
-- year for every row that has none.
create or replace function run_expiry_sweep()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count int;
  cur record;
  target record;
  flipped boolean := false;
begin
  update memberships m
  set status = 'expired'
  from membership_periods p
  where p.id = m.period_id
    and m.status = 'active'
    and coalesce(m.ends_on, p.ends_on) < current_date;
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

  perform audit('membership.expiry_sweep', 'memberships', null, null,
    jsonb_build_object('expired', expired_count, 'period_flipped', flipped));

  return jsonb_build_object('expired', expired_count, 'period_flipped', flipped);
end;
$$;

/* ------------------------------------------------- buying by type, not tier */

create or replace function request_membership_type(
  p_type_id uuid,
  p_family jsonb default '[]'::jsonb,
  p_period_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  t membership_types%rowtype;
  period uuid;
  mem uuid;
  me record;
  self_name text;
  fam jsonb;
  fname text;
  fdob date;
begin
  if uid is null then
    raise exception 'sign in to request a membership';
  end if;

  select * into t from membership_types where id = p_type_id;
  if not found then
    raise exception 'no such membership type';
  end if;
  if not t.is_active then
    raise exception 'that membership is not on sale at the moment';
  end if;

  if p_period_id is null then
    select id into period from membership_periods where is_current;
  else
    select id into period from membership_periods where id = p_period_id;
  end if;
  if period is null then
    raise exception 'no such membership period';
  end if;

  -- "Already a member" now means a membership that has not run out yet, so a
  -- half-year member can buy their next one the day the first ends.
  if exists (
    select 1 from memberships m
    join membership_periods mp on mp.id = m.period_id
    where m.period_id = period and m.status = 'active'
      and coalesce(m.ends_on, mp.ends_on) >= current_date
      and (m.primary_user_id = uid
           or exists (select 1 from membership_members mm
                      where mm.membership_id = m.id and mm.user_id = uid))
  ) then
    raise exception 'you already have a membership running for this period';
  end if;

  select first_name, last_name, date_of_birth into me from profiles where user_id = uid;
  self_name := trim(coalesce(me.first_name, '') || ' ' || coalesce(me.last_name, ''));

  select id into mem from memberships
  where period_id = period and primary_user_id = uid and status = 'pending';

  if mem is not null then
    delete from membership_members where membership_id = mem;
    update memberships
    set tier = t.legacy_tier, membership_type_id = t.id, amount_pence = t.price_pence,
        source = 'manual_bank', paypal_order_id = null, paypal_capture_id = null
    where id = mem;
  else
    insert into memberships (period_id, tier, membership_type_id, status, primary_user_id, amount_pence, source)
    values (period, t.legacy_tier, t.id, 'pending', uid, t.price_pence, 'manual_bank')
    returning id into mem;
  end if;

  insert into membership_members (membership_id, user_id, display_name, is_junior, date_of_birth)
  values (mem, uid, self_name, is_junior(me.date_of_birth), me.date_of_birth);

  -- Covering other people is a property of the type now, not a hard-coded
  -- check for the word "family".
  if t.covers_family then
    for fam in select value from jsonb_array_elements(coalesce(p_family, '[]'::jsonb)) loop
      fname := trim(coalesce(fam->>'name', ''));
      fdob := nullif(fam->>'dob', '')::date;
      if length(fname) > 0 and lower(fname) <> lower(self_name) then
        insert into membership_members
          (membership_id, display_name, date_of_birth, is_junior,
           emergency_contact_name, emergency_contact_phone)
        values
          (mem, fname, fdob, is_junior(fdob),
           nullif(fam->>'emergency_contact_name', ''), nullif(fam->>'emergency_contact_phone', ''))
        on conflict do nothing;
      end if;
    end loop;
  end if;

  perform audit('membership.requested', 'memberships', mem, null,
    jsonb_build_object('type', t.slug, 'tier', t.legacy_tier,
                       'amount_pence', t.price_pence, 'period_id', period));

  return mem;
end;
$$;

/* ------------------------------------------ the committee's manual version */

create or replace function admin_create_membership_type(
  p_user_id uuid,
  p_type_id uuid,
  p_source payment_source,
  p_amount_pence int default null,
  p_period_id uuid default null,
  p_note text default null,
  p_family jsonb default '[]'::jsonb,
  p_activate boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t membership_types%rowtype;
  period uuid;
  amount int;
  mem uuid;
  me record;
  self_name text;
  fam jsonb;
  fname text;
  fdob date;
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;

  select * into t from membership_types where id = p_type_id;
  if not found then
    raise exception 'no such membership type';
  end if;

  if p_period_id is null then
    select id into period from membership_periods where is_current;
  else
    select id into period from membership_periods where id = p_period_id;
  end if;
  if period is null then
    raise exception 'no such membership period';
  end if;

  amount := coalesce(p_amount_pence, t.price_pence);
  if p_source = 'complimentary' then
    amount := coalesce(p_amount_pence, 0);
  end if;

  select first_name, last_name, date_of_birth into me from profiles where user_id = p_user_id;
  if not found then
    raise exception 'no such member';
  end if;
  self_name := trim(coalesce(me.first_name, '') || ' ' || coalesce(me.last_name, ''));

  insert into memberships (period_id, tier, membership_type_id, status, primary_user_id,
                           amount_pence, source, recorded_by, notes, paid_at)
  values (period, t.legacy_tier, t.id,
          case when p_activate then 'active' else 'pending' end,
          p_user_id, amount, p_source, auth.uid(), p_note,
          case when p_activate then now() else null end)
  returning id into mem;

  insert into membership_members (membership_id, user_id, display_name, is_junior, date_of_birth)
  values (mem, p_user_id, self_name, is_junior(me.date_of_birth), me.date_of_birth);

  if t.covers_family then
    for fam in select value from jsonb_array_elements(coalesce(p_family, '[]'::jsonb)) loop
      fname := trim(coalesce(fam->>'name', ''));
      fdob := nullif(fam->>'dob', '')::date;
      if length(fname) > 0 and lower(fname) <> lower(self_name) then
        insert into membership_members
          (membership_id, display_name, date_of_birth, is_junior,
           emergency_contact_name, emergency_contact_phone)
        values
          (mem, fname, fdob, is_junior(fdob),
           nullif(fam->>'emergency_contact_name', ''), nullif(fam->>'emergency_contact_phone', ''))
        on conflict do nothing;
      end if;
    end loop;
  end if;

  perform audit('membership.admin_created', 'memberships', mem, null,
    jsonb_build_object('type', t.slug, 'source', p_source, 'amount_pence', amount,
                       'activated', p_activate));

  return mem;
end;
$$;
