-- 0024 — four items from the September 2026 change request:
--   3. river level bands the committee edits themselves
--   4. the Farson webcam link at Atcham, with its distance caveat
--   6. shop item visibility, plus a master open/closed switch
--   7. notice-only events: things happening on site that members are told
--      about but not invited to (scout camps, fire service training)

/* ------------------------------------------------- 3. river level bands */

-- Stored in whole centimetres. The Environment Agency publishes metres, but
-- the club talks in centimetres ("under 50", "over 200"), and 0.37 m reads as
-- 37 cm which matches how they describe the rapid. The public page prints both.
--
-- Both ends are nullable so the ladder can be open at the bottom and the top:
-- null min means "anything below max", null max means "anything above min".
create table if not exists river_level_bands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  min_cm int check (min_cm is null or min_cm >= 0),
  max_cm int check (max_cm is null or max_cm >= 0),
  label text not null,
  description text,
  sort_order int not null default 0,
  constraint river_level_bands_ordered check (
    min_cm is null or max_cm is null or max_cm > min_cm
  ),
  -- A band open at both ends would swallow every reading.
  constraint river_level_bands_bounded check (min_cm is not null or max_cm is not null)
);

create index if not exists river_level_bands_order
  on river_level_bands (sort_order, min_cm);

drop trigger if exists river_level_bands_updated_at on river_level_bands;
create trigger river_level_bands_updated_at
  before update on river_level_bands
  for each row execute function set_updated_at();

alter table river_level_bands enable row level security;

drop policy if exists river_level_bands_read on river_level_bands;
create policy river_level_bands_read on river_level_bands for select using (true);

drop policy if exists river_level_bands_committee_all on river_level_bands;
create policy river_level_bands_committee_all on river_level_bands
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

-- Simon's own worked example, so the screen is not empty on first open. The
-- committee can rename, renumber or delete any of these.
insert into river_level_bands (min_cm, max_cm, label, description, sort_order)
select * from (values
  (null, 50, 'Surfs up', 'The wave is working. The usual playing level at Jackfield.', 1),
  (50, 100, 'Wave flushing', 'Pushier and washed out, the wave stops holding a boat.', 2),
  (100, 200, 'All gone', 'The feature has disappeared under the flow.', 3),
  (200, null, 'Beach gone', 'High water. The beach is under, get-in and get-out are affected.', 4)
) as seed(min_cm, max_cm, label, description, sort_order)
where not exists (select 1 from river_level_bands);

/* ----------------------------------------- 4. webcam, 6. shop switches */

alter table club_settings
  add column if not exists webcam_url text
    default 'https://www.farsondigitalwatercams.com/locations/atcham',
  add column if not exists webcam_note text
    default 'Atcham is about 10 miles upstream, so it shows what is coming rather than the level at the club.',
  add column if not exists shop_open boolean not null default true,
  add column if not exists shop_closed_note text
    default 'The shop is closed at the moment. The club runs kit orders a couple of times a year, watch the notices.';

/* ------------------------------------------- 7. notice-only events */

alter table events
  add column if not exists kind text not null default 'bookable',
  -- "who is on site", for a member reading it in a car park.
  add column if not exists on_site_note text;

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('bookable', 'notice_only'));

-- The rule that matters, held by the database rather than by every screen that
-- might forget it: a notice-only event can never be bookable. `book_event()`
-- already refuses an event with booking switched off, so it needs no change.
alter table events drop constraint if exists events_notice_only_not_bookable;
alter table events add constraint events_notice_only_not_bookable
  check (kind = 'bookable' or booking_enabled = false);
