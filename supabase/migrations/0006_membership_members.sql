-- P1-05 — who a membership covers (1 row adult/junior, n rows family).
-- Spec §5.2 correction (SPEC-VALIDATION §1.3): surrogate PK + a typed
-- expression unique index instead of the invalid coalesce(uuid, text) PK.
create table membership_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  membership_id uuid not null references memberships (id) on delete cascade,
  user_id uuid references profiles (user_id),
  display_name text not null,
  is_junior boolean not null default false
);

create unique index membership_members_person_once
  on membership_members (membership_id, coalesce(user_id::text, lower(display_name)));

create index membership_members_user on membership_members (user_id);

alter table membership_members enable row level security;

-- Definer helpers so the two tables' policies can look across without RLS
-- re-entering itself (memberships policy → mm policy → memberships policy…).
create or replace function membership_covers(mid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from membership_members where membership_id = mid and user_id = uid
  );
$$;

create or replace function is_membership_payer(mid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships where id = mid and primary_user_id = uid
  );
$$;

-- §5.4: own R (covered person, or the payer seeing who's on their membership);
-- committee/admin all R/W.
create policy mm_select_own on membership_members
  for select using (
    user_id = auth.uid() or is_membership_payer(membership_id, auth.uid())
  );

create policy mm_committee_all on membership_members
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

-- Widen the memberships own-read policy now both tables exist: a covered
-- family member may read the membership that covers them, not just the payer.
drop policy memberships_select_own on memberships;
create policy memberships_select_own on memberships
  for select using (
    primary_user_id = auth.uid() or membership_covers(id, auth.uid())
  );
