-- P1-11 — committee roles (drives the public committee page) and
-- members-only notices (gate code etc).
create table committee_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  role_title text not null unique,
  description text,
  holder_user_id uuid references profiles (user_id),
  holder_display_name text,
  contact_email text,
  sort_order int not null default 0,
  is_vacant boolean generated always as (
    holder_user_id is null and holder_display_name is null
  ) stored
);

create trigger committee_roles_updated_at
  before update on committee_roles
  for each row execute function set_updated_at();

alter table committee_roles enable row level security;

create policy committee_roles_read on committee_roles
  for select using (true);

create policy committee_roles_write on committee_roles
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create table notices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  title text not null,
  body text not null,
  visibility visibility not null default 'members'
    check (visibility in ('members', 'committee')),
  pinned boolean not null default false,
  expires_at timestamptz,
  created_by uuid references profiles (user_id)
);

create trigger notices_updated_at
  before update on notices
  for each row execute function set_updated_at();

alter table notices enable row level security;

create policy notices_members_read on notices
  for select using (visibility = 'members' and is_current_member(auth.uid()));

create policy notices_committee_all on notices
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));
