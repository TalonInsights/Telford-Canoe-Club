-- P1-04 — the core table: one row = one person (or family) paying one period.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  period_id uuid not null references membership_periods (id),
  tier membership_tier not null,
  status membership_status not null default 'pending',
  primary_user_id uuid not null references profiles (user_id),
  amount_pence int not null check (amount_pence >= 0),
  source payment_source not null,
  paypal_order_id text unique,
  paypal_capture_id text unique,
  paid_at timestamptz,
  recorded_by uuid references profiles (user_id),
  notes text
);

create index memberships_user_period on memberships (primary_user_id, period_id);
create index memberships_period_status on memberships (period_id, status);

-- At most one ACTIVE membership per person per period (§5.2 constraint).
create unique index memberships_one_active
  on memberships (primary_user_id, period_id) where status = 'active';

create trigger memberships_updated_at
  before update on memberships
  for each row execute function set_updated_at();

alter table memberships enable row level security;

-- §5.4: registered/member — own R; committee/admin — all R/W. The payer
-- policy lands here; covered family members gain read in 0006 once
-- membership_members exists. The cross-table check there goes through a
-- security-definer helper — two policies referencing each other's tables
-- directly is infinite recursion (caught by the P1-17 harness).
create policy memberships_select_own on memberships
  for select using (primary_user_id = auth.uid());

create policy memberships_committee_all on memberships
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

-- First active membership promotes registered → member (§6). Runs as
-- definer so the role guard's authorisation flag can be set safely.
create or replace function promote_on_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform set_config('app.role_change_authorised', 'yes', true);
    update profiles set role = 'member'
    where user_id = new.primary_user_id and role = 'registered';
    perform set_config('app.role_change_authorised', '', true);
  end if;
  return new;
end;
$$;

create trigger memberships_promote
  after insert or update of status on memberships
  for each row execute function promote_on_activation();
