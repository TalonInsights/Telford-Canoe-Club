-- P1-08 — events, bookings, media.
create table events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique,
  title text not null,
  summary text,
  body jsonb,
  category text not null default 'other'
    check (category in ('club_night','trip','freestyle','slalom','pool','social','course','other')),
  location_name text,
  location_address text,
  location_lat numeric,
  location_lng numeric,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  visibility visibility not null default 'public',
  booking_enabled boolean not null default false,
  booking_opens_at timestamptz,
  booking_closes_at timestamptz,
  capacity int check (capacity is null or capacity > 0),
  allow_waitlist boolean not null default true,
  members_only_booking boolean not null default true,
  cost_pence int not null default 0 check (cost_pence >= 0),
  cost_note text,
  water_level_dependent boolean not null default false,
  organiser_user_id uuid references profiles (user_id),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  cover_image_path text,
  recurrence_rule text
);

create index events_starts_at on events (starts_at);
create index events_status_visibility on events (status, visibility);

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

alter table events enable row level security;

create policy events_public_read on events
  for select using (status in ('published', 'cancelled') and visibility = 'public');

create policy events_members_read on events
  for select using (
    status in ('published', 'cancelled')
    and visibility = 'members'
    and is_current_member(auth.uid())
  );

create policy events_committee_all on events
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create table event_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (user_id),
  status booking_status not null default 'booked',
  guests int not null default 0 check (guests >= 0),
  note text,
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  unique (event_id, user_id)
);

create trigger event_bookings_updated_at
  before update on event_bookings
  for each row execute function set_updated_at();

alter table event_bookings enable row level security;

-- §5.4: own R/W (booking logic beyond this — capacity, waitlist, members-only
-- enforcement — lives in the P5-04 server action, which runs as the user).
create policy bookings_select_own on event_bookings
  for select using (user_id = auth.uid());

create policy bookings_insert_own on event_bookings
  for insert with check (user_id = auth.uid());

create policy bookings_update_own on event_bookings
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy bookings_committee_all on event_bookings
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create table event_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references events (id) on delete cascade,
  kind text not null check (kind in ('image', 'video_embed')),
  storage_path text,
  embed_url text,
  caption text,
  sort_order int not null default 0,
  uploaded_by uuid references profiles (user_id),
  check (
    (kind = 'image' and storage_path is not null)
    or (kind = 'video_embed' and embed_url is not null)
  )
);

alter table event_media enable row level security;

-- Media follows its event's visibility.
create policy event_media_read on event_media
  for select using (
    exists (
      select 1 from events e
      where e.id = event_id
        and e.status in ('published', 'cancelled')
        and (
          e.visibility = 'public'
          or (e.visibility = 'members' and is_current_member(auth.uid()))
        )
    )
  );

create policy event_media_committee_all on event_media
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));
