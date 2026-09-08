-- 0022 — committee meeting minutes, and a private home for committee-only
-- documents (client order 8 Sep 2026).
--
-- Two separate jobs:
--
-- 1. `meeting_minutes` — minutes are written in the site from a template, not
--    uploaded as a file, so they are readable on a phone and searchable. The
--    body is an ordered list of typed blocks (heading / paragraph / bullets),
--    never HTML, so nothing a committee member types can become markup. A
--    scan of the signed original can be attached alongside.
--
-- 2. A `documents-committee` storage bucket. The `documents` table already
--    understands `visibility = 'committee'` (0009) and its RLS already limits
--    those rows to the committee. Storage was the hole: the
--    `documents-members` select policy (0016) is bucket-wide, so any current
--    member who guessed an object path could fetch a committee file whatever
--    the table row said. Committee files therefore get their own private
--    bucket whose every policy demands the committee role.

/* ------------------------------------------------------------------ minutes */

create table if not exists meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  meeting_date date not null,
  title text not null,
  -- [{ "type": "heading" | "paragraph" | "bullets", "text": "..." }]
  body jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  -- Optional scan of the signed original, in the documents-members bucket.
  attachment_path text,
  attachment_name text,
  created_by uuid references profiles (user_id)
);

create index if not exists meeting_minutes_meeting_date
  on meeting_minutes (meeting_date desc);

create index if not exists meeting_minutes_status
  on meeting_minutes (status, meeting_date desc);

drop trigger if exists meeting_minutes_updated_at on meeting_minutes;
create trigger meeting_minutes_updated_at
  before update on meeting_minutes
  for each row execute function set_updated_at();

alter table meeting_minutes enable row level security;

-- Every current member reads published minutes; drafts stay with the
-- committee until they are approved. Committee members read their own drafts
-- through the write policy below, which does not require a paid membership.
drop policy if exists meeting_minutes_members_read on meeting_minutes;
create policy meeting_minutes_members_read on meeting_minutes
  for select using (
    status = 'published'
    and (is_current_member(auth.uid()) or has_role(auth.uid(), 'committee'))
  );

drop policy if exists meeting_minutes_committee_all on meeting_minutes;
create policy meeting_minutes_committee_all on meeting_minutes
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

/* ------------------------------------------- committee document categories */

-- The club's committee-only records are bookings, council contacts and an
-- inventory (client order), none of which the 0009 check constraint allowed.
alter table documents drop constraint if exists documents_category_check;
alter table documents add constraint documents_category_check check (
  category in (
    'policy', 'procedure', 'constitution', 'minutes', 'agm', 'form', 'guide',
    'bookings', 'contacts', 'inventory', 'finance', 'insurance', 'other'
  )
);

/* --------------------------------------------- committee-only file storage */

insert into storage.buckets (id, name, public)
values ('documents-committee', 'documents-committee', false)
on conflict (id) do nothing;

-- Committee and admin only, in every direction. Nothing here is readable by a
-- paid member, by an anonymous visitor, or by a guessed object path.
drop policy if exists "documents-committee write" on storage.objects;
create policy "documents-committee write" on storage.objects
  for insert with check (
    bucket_id = 'documents-committee' and has_role(auth.uid(), 'committee')
  );

drop policy if exists "documents-committee update" on storage.objects;
create policy "documents-committee update" on storage.objects
  for update using (
    bucket_id = 'documents-committee' and has_role(auth.uid(), 'committee')
  );

drop policy if exists "documents-committee delete" on storage.objects;
create policy "documents-committee delete" on storage.objects
  for delete using (
    bucket_id = 'documents-committee' and has_role(auth.uid(), 'committee')
  );

drop policy if exists "documents-committee read" on storage.objects;
create policy "documents-committee read" on storage.objects
  for select using (
    bucket_id = 'documents-committee' and has_role(auth.uid(), 'committee')
  );
