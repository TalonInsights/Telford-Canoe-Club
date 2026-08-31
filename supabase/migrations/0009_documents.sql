-- P1-09 — document library metadata (files live in storage, §5.3).
create table documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  title text not null,
  category text not null default 'other'
    check (category in ('policy','procedure','constitution','minutes','agm','form','guide','other')),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0),
  version_label text,
  effective_from date,
  review_due date,
  visibility visibility not null default 'members',
  sort_order int not null default 0,
  uploaded_by uuid references profiles (user_id),
  superseded_by uuid references documents (id)
);

create index documents_category on documents (category, visibility);

create trigger documents_updated_at
  before update on documents
  for each row execute function set_updated_at();

alter table documents enable row level security;

create policy documents_public_read on documents
  for select using (visibility = 'public');

create policy documents_members_read on documents
  for select using (visibility = 'members' and is_current_member(auth.uid()));

create policy documents_committee_all on documents
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));
