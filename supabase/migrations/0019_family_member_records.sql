-- 0019 — family members become fuller individual records.
-- Each person on a family membership now carries their own date of birth and
-- emergency contact, not just a display name. Columns are additive (safe on
-- existing rows); request_membership / admin_create_membership swap their
-- text[] name list for a jsonb array of {name, dob, emergency_contact_name,
-- emergency_contact_phone} — a signature change, so drop + recreate. Deploy
-- the matching app code together with this migration.

-- ------------------------------------------------------------- columns
alter table membership_members
  add column if not exists date_of_birth date,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

-- ------------------------------------------------- request_membership
drop function if exists request_membership(membership_tier, text[], uuid);
drop function if exists request_membership(membership_tier, text[]);

create or replace function request_membership(
  p_tier membership_tier,
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
  period uuid;
  amount int;
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
  self_name := trim(coalesce(me.first_name, '') || ' ' || coalesce(me.last_name, ''));

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

  -- the account holder (details come from their profile)
  insert into membership_members (membership_id, user_id, display_name, is_junior, date_of_birth)
  values (mem, uid, self_name, is_junior(me.date_of_birth), me.date_of_birth);

  -- each additional family member: an individual record with its own details
  if p_tier = 'family' then
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
    jsonb_build_object('tier', p_tier, 'amount_pence', amount, 'period_id', period));

  return mem;
end;
$$;

-- --------------------------------------------- admin_create_membership
drop function if exists admin_create_membership(uuid, membership_tier, uuid, payment_source, int, boolean, text, text[]);

create or replace function admin_create_membership(
  p_user_id uuid,
  p_tier membership_tier,
  p_period_id uuid,
  p_source payment_source,
  p_amount_pence int default null,
  p_activate boolean default true,
  p_note text default null,
  p_family jsonb default '[]'::jsonb
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
  self_name text;
  fam jsonb;
  fname text;
  fdob date;
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
  insert into membership_members (membership_id, user_id, display_name, is_junior, date_of_birth)
  values (mem, p_user_id, self_name, is_junior(target.date_of_birth), target.date_of_birth);

  if p_tier = 'family' then
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
    jsonb_build_object('user_id', p_user_id, 'tier', p_tier, 'source', p_source,
                       'amount_pence', amount, 'activated', p_activate));

  return mem;
end;
$$;
