-- P1-12 — saved member filters + the §5.2 system segments.
create table segments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  name text not null unique,
  definition jsonb not null,
  created_by uuid references profiles (user_id),
  is_system boolean not null default false
);

create trigger segments_updated_at
  before update on segments
  for each row execute function set_updated_at();

alter table segments enable row level security;

create policy segments_committee_all on segments
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

insert into segments (name, definition, is_system) values
  ('Current paid members',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"current"}]}', true),
  ('Current adult members',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"current"},{"field":"profile.is_junior","op":"eq","value":false}]}', true),
  ('Current junior members',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"current"},{"field":"profile.is_junior","op":"eq","value":true}]}', true),
  ('Current family memberships',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"current"},{"field":"membership.tier","op":"eq","value":"family"}]}', true),
  ('Lapsed — paid last year, not this year',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"previous"},{"field":"membership.status","op":"eq","value":"none","period":"current"}]}', true),
  ('Registered, never paid',
   '{"all":[{"field":"membership.status","op":"eq","value":"none","period":"any"}]}', true),
  ('Expiring in 30 days',
   '{"all":[{"field":"membership.status","op":"eq","value":"active","period":"current"},{"field":"period.ends_within_days","op":"lte","value":30}]}', true),
  ('Committee',
   '{"all":[{"field":"profile.role","op":"in","value":["committee","admin"]}]}', true);
