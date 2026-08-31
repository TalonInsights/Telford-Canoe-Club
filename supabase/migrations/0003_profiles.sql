-- P1-02 — profiles 1:1 with auth.users, signup trigger, updated_at, RLS.
create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  role app_role not null default 'registered',
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  phone text,
  address_line1 text,
  address_line2 text,
  town text,
  postcode text,
  date_of_birth date,
  bc_membership_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  guardian_name text,
  guardian_phone text,
  medical_notes text,
  avatar_path text,
  email_opt_in boolean not null default true,
  legacy_arm_user_id int,
  notes_internal text,
  deactivated_at timestamptz
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Mirror auth signups (and email changes) into profiles.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set email = new.email where user_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function handle_user_email_change();

-- role changes only via set_user_role() (security definer, admin-gated) —
-- this guard stops committee/self escalation through a plain UPDATE.
create or replace function guard_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('app.role_change_authorised', true), '') <> 'yes' then
    raise exception 'roles change only through set_user_role()';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function guard_role_change();

alter table profiles enable row level security;

-- §5.4: registered/member — own row R/W (role guarded above);
-- committee — all R/W except role; admin — all R/W.
create policy profiles_select_own on profiles
  for select using (user_id = auth.uid());

create policy profiles_update_own on profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy profiles_committee_select on profiles
  for select using (has_role(auth.uid(), 'committee'));

create policy profiles_committee_update on profiles
  for update using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create policy profiles_admin_insert on profiles
  for insert with check (has_role(auth.uid(), 'admin'));

create policy profiles_admin_delete on profiles
  for delete using (has_role(auth.uid(), 'admin'));
