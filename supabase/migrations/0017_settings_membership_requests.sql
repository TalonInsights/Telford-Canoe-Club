-- Club settings (single row) + the self-service membership request path.
-- The join flow works WITHOUT payment integration: a member requests a tier,
-- a pending membership row is created for the current period, and the
-- committee activates it from the admin area when money arrives by bank
-- transfer or cash. PayPal (Phase 4) will simply activate the same rows.

create table club_settings (
  id boolean primary key default true check (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  site_status text not null default 'open' check (site_status in ('open', 'closed')),
  site_status_note text,
  membership_year_label text not null default 'Annual membership',
  show_unconfirmed boolean not null default false,
  price_adult_pence int not null default 2500 check (price_adult_pence >= 0),
  price_junior_pence int not null default 1500 check (price_junior_pence >= 0),
  price_family_pence int not null default 4000 check (price_family_pence >= 0),
  bank_payment_note text not null default 'Pay by bank transfer or cash to the treasurer — your membership is confirmed as soon as the committee records it.'
);

create trigger club_settings_updated_at
  before update on club_settings
  for each row execute function set_updated_at();

alter table club_settings enable row level security;

-- Prices and site status are public information; only admin changes them (§8).
create policy club_settings_read on club_settings for select using (true);
create policy club_settings_admin_write on club_settings
  for update using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

insert into club_settings (id) values (true);

-- Self-service: any signed-in user asks for a membership; the row sits
-- 'pending' until the committee records payment. Idempotent per period —
-- re-requesting replaces the pending request rather than stacking them.
create or replace function request_membership(p_tier membership_tier, p_family_names text[] default '{}')
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

  select id into period from membership_periods where is_current;
  if period is null then
    raise exception 'no current membership period';
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
    update memberships set tier = p_tier, amount_pence = amount, source = 'manual_bank' where id = mem;
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
    jsonb_build_object('tier', p_tier, 'amount_pence', amount));

  return mem;
end;
$$;
