-- P1-03 — one row per membership year; exactly one current.
create table membership_periods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  label text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  check (ends_on > starts_on)
);

create unique index membership_periods_one_current
  on membership_periods (is_current) where is_current;

create trigger membership_periods_updated_at
  before update on membership_periods
  for each row execute function set_updated_at();

alter table membership_periods enable row level security;

-- Periods are harmless reference data: anyone may read (the join page shows
-- "runs to 31 December"); only committee+ writes.
create policy periods_select_all on membership_periods
  for select using (true);

create policy periods_committee_write on membership_periods
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

insert into membership_periods (label, starts_on, ends_on, is_current) values
  ('2025', '2025-01-01', '2025-12-31', false),
  ('2026', '2026-01-01', '2026-12-31', true);
