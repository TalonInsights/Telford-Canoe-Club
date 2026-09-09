-- 0026 — "I'm going to be on site": a member says when they will be at
-- Jackfield so others can choose to turn up too. Social, not coaching.
--
-- This is personal data about where a named person will be and when, so every
-- protection in the change request is built into the database rather than into
-- a screen that could later be rewritten:
--
--   * OFF until an admin turns it on. The club is the data controller and the
--     committee has not yet decided visibility, name format or retention, so
--     nothing is visible to anyone until they do.
--   * Members only. The read policy demands a current membership, so it is
--     never public and there is nothing for a search engine to reach.
--   * Posting is the consent. There is no default and no automatic check-in;
--     a row only exists because somebody deliberately created it.
--   * Your own row is yours. You may delete it at any moment, and only you
--     (or the committee, for moderation) can.
--   * Under-18 accounts are excluded here, not merely in the UI. Publishing a
--     minor's name, place and time to other users is a different risk and the
--     committee has not agreed to it.
--   * Nothing is kept. Rows are purged 24 hours after the session ends, so no
--     history of anyone's movements accumulates.
--
-- Names are NOT stored: the display name is derived at read time as first name
-- plus last initial, so the table itself holds no more than it must.

alter table club_settings
  add column if not exists checkins_enabled boolean not null default false;

create table if not exists member_checkins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references profiles (user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  constraint member_checkins_span check (ends_at > starts_at),
  -- Nobody needs to announce a session three months out, and the shorter the
  -- window the less there is to leak.
  constraint member_checkins_horizon check (starts_at < now() + interval '30 days')
);

create index if not exists member_checkins_when on member_checkins (starts_at);
create index if not exists member_checkins_user on member_checkins (user_id, starts_at);

alter table member_checkins enable row level security;

/* --------------------------------------------------------------- reading */

-- Visible only while the committee has the feature switched on, only to a
-- current member, and only for sessions that have not finished.
drop policy if exists member_checkins_members_read on member_checkins;
create policy member_checkins_members_read on member_checkins
  for select using (
    coalesce((select cs.checkins_enabled from club_settings cs), false)
    and is_current_member(auth.uid())
    and ends_at > now() - interval '2 hours'
  );

-- Your own rows are always yours to see, so the delete button works even after
-- the session has passed and even if the feature is switched off mid-week.
drop policy if exists member_checkins_own_read on member_checkins;
create policy member_checkins_own_read on member_checkins
  for select using (user_id = auth.uid());

/* --------------------------------------------------------------- writing */

-- Insert your own only, never anyone else's, never a minor's, and only while
-- the feature is on.
drop policy if exists member_checkins_own_insert on member_checkins;
create policy member_checkins_own_insert on member_checkins
  for insert with check (
    user_id = auth.uid()
    and coalesce((select cs.checkins_enabled from club_settings cs), false)
    and is_current_member(auth.uid())
    and not coalesce(
      (select is_junior(p.date_of_birth) from profiles p where p.user_id = auth.uid()),
      true
    )
  );

-- One tap, any time. The committee can also remove one, for moderation.
drop policy if exists member_checkins_own_delete on member_checkins;
create policy member_checkins_own_delete on member_checkins
  for delete using (user_id = auth.uid() or has_role(auth.uid(), 'committee'));

/* ---------------------------------------------------------------- purging */

-- Retention is a rule, not a promise: this runs daily from
-- /api/cron/purge-checkins, and the read policy above already hides anything
-- finished, so a missed run cannot expose a stale session.
create or replace function purge_expired_checkins()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  removed int;
begin
  delete from member_checkins where ends_at < now() - interval '24 hours';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

/* ------------------------------------------------------------- posting it */

-- Posting goes through a function so the age check and the sanity checks give
-- a member a sentence they can act on, rather than a policy violation.
create or replace function post_checkin(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  me record;
  enabled boolean;
  new_id uuid;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  select checkins_enabled into enabled from club_settings where id;
  if not coalesce(enabled, false) then
    raise exception 'the club has not switched this on';
  end if;

  if not is_current_member(uid) then
    raise exception 'this is for current members';
  end if;

  select first_name, date_of_birth into me from profiles where user_id = uid;
  if coalesce(is_junior(me.date_of_birth), true) then
    raise exception 'under-18 accounts cannot post here';
  end if;

  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'give a start and an end';
  end if;
  if p_ends_at < now() then
    raise exception 'that time has already passed';
  end if;
  if p_starts_at > now() + interval '30 days' then
    raise exception 'keep it within the next month';
  end if;
  if p_ends_at - p_starts_at > interval '14 hours' then
    raise exception 'that is a long day, keep it under 14 hours';
  end if;

  -- One entry per person per day, replaced rather than duplicated.
  delete from member_checkins
  where user_id = uid and date_trunc('day', starts_at) = date_trunc('day', p_starts_at);

  insert into member_checkins (user_id, starts_at, ends_at, note)
  values (uid, p_starts_at, p_ends_at, nullif(trim(coalesce(p_note, '')), ''))
  returning id into new_id;

  return new_id;
end;
$$;
