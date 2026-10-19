-- The booking gate (Simon 6.3): before a member can take a place they must
-- have an emergency contact on file, answer a medical question yes or no, and
-- agree to the code of conduct. They may also flag that they need to borrow
-- club kit. The leader then sees kit, the medical flag and whether an
-- emergency contact exists (6.4).
--
-- Only the Yes/No medical FLAG is ever stored, never any detail — if the
-- answer is yes the leader contacts the member off-system. That is the whole
-- point of the design: the club holds a boolean, not health information.
alter table event_bookings
  add column if not exists needs_kit boolean not null default false,
  add column if not exists medical_flag boolean,
  add column if not exists agreed_terms_at timestamptz;

-- book_event gains the gate. The extra arguments default to the old behaviour
-- so nothing else that calls it breaks, but the member booking flow always
-- passes them, and the checks below refuse a booking that has not cleared the
-- gate. The capacity, waitlist and members-only logic is unchanged.
create or replace function book_event(
  p_event_id uuid,
  p_needs_kit boolean default false,
  p_medical_flag boolean default null,
  p_agree boolean default false
)
returns booking_status
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ev events%rowtype;
  existing event_bookings%rowtype;
  me profiles%rowtype;
  taken int;
  result booking_status;
  bid uuid;
begin
  if uid is null then
    raise exception 'log in to confirm your place';
  end if;

  select * into ev from events where id = p_event_id for update;
  if not found or ev.status <> 'published' then
    raise exception 'this event is not open';
  end if;
  if not ev.booking_enabled then
    raise exception 'this event does not take confirmations — just turn up';
  end if;
  if ev.starts_at < now() then
    raise exception 'this event has already started';
  end if;
  if ev.booking_opens_at is not null and ev.booking_opens_at > now() then
    raise exception 'confirmations have not opened yet';
  end if;
  if ev.booking_closes_at is not null and ev.booking_closes_at < now() then
    raise exception 'confirmations have closed';
  end if;
  if (ev.members_only_booking or ev.visibility = 'members')
     and not is_current_member(uid)
     and not has_role(uid, 'committee') then
    raise exception 'this event is for current members — join the club to confirm a place';
  end if;

  select * into existing
    from event_bookings
   where event_id = p_event_id and user_id = uid
   for update;
  if found and existing.status in ('booked', 'waitlist', 'attended') then
    return existing.status; -- already confirmed: a repeat click changes nothing
  end if;

  -- The gate. These run only for a genuine new or re-made booking.
  if not p_agree then
    raise exception 'you need to accept the code of conduct and policies to confirm a place';
  end if;
  if p_medical_flag is null then
    raise exception 'please answer the medical question before confirming';
  end if;
  select * into me from profiles where user_id = uid;
  if coalesce(nullif(trim(me.emergency_contact_name), ''), '') = ''
     or coalesce(nullif(trim(me.emergency_contact_phone), ''), '') = '' then
    raise exception 'add an emergency contact to your profile before confirming a place';
  end if;

  select count(*) into taken
    from event_bookings
   where event_id = p_event_id and status in ('booked', 'attended');

  if ev.capacity is not null and taken >= ev.capacity then
    if not ev.allow_waitlist then
      raise exception 'this event is full';
    end if;
    result := 'waitlist';
  else
    result := 'booked';
  end if;

  insert into event_bookings
    (event_id, user_id, status, booked_at, needs_kit, medical_flag, agreed_terms_at)
  values
    (p_event_id, uid, result, now(), p_needs_kit, p_medical_flag, now())
  on conflict (event_id, user_id) do update
    set status = excluded.status,
        booked_at = now(),
        cancelled_at = null,
        checked_in_at = null,
        needs_kit = excluded.needs_kit,
        medical_flag = excluded.medical_flag,
        agreed_terms_at = excluded.agreed_terms_at
  returning id into bid;

  perform audit(
    case when result = 'booked' then 'booking.confirmed' else 'booking.waitlisted' end,
    'event_bookings', bid, null,
    jsonb_build_object('event_id', p_event_id, 'event', ev.title, 'user_id', uid,
                       'needs_kit', p_needs_kit, 'medical_flag', p_medical_flag)
  );
  return result;
end;
$$;

-- Remove the old gate-less overload from 0020, so a bare book_event(event_id)
-- now resolves to the gated version with p_agree defaulting false — it fails
-- closed rather than booking someone past the gate.
drop function if exists book_event(uuid);
