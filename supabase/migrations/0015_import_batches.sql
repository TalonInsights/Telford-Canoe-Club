-- P1-15 — ARMember import runs (Phase 11).
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  file_name text,
  row_count int not null default 0,
  imported_count int not null default 0,
  skipped_count int not null default 0,
  log jsonb,
  run_by uuid references profiles (user_id)
);

alter table import_batches enable row level security;

create policy import_batches_admin_all on import_batches
  for all using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));
