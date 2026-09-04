-- P5-04 — the booking engine. Places are decided INSIDE the database under a
-- row lock on the event, so two people confirming at once can never oversell
-- a capacity. Definer functions because RLS on event_bookings is own-rows
-- only, yet waitlist promotion has to move somebody else's row.

create or replace function book_event(p_event_id uuid)
returns booking_status
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ev events%rowtype;
  existing event_bookings%rowtype;
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

  insert into event_bookings (event_id, user_id, status, booked_at)
  values (p_event_id, uid, result, now())
  on conflict (event_id, user_id) do update
    set status = excluded.status,
        booked_at = now(),
        cancelled_at = null,
        checked_in_at = null
  returning id into bid;

  perform audit(
    case when result = 'booked' then 'booking.confirmed' else 'booking.waitlisted' end,
    'event_bookings', bid, null,
    jsonb_build_object('event_id', p_event_id, 'event', ev.title, 'user_id', uid)
  );
  return result;
end;
$$;

-- Cancels a place (own, or anyone's for committee) and promotes the longest
-- waiting person if a held place was freed. Returns the promoted person as
-- jsonb {user_id, email, name} so the caller can email them, else null.
create or replace function cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b event_bookings%rowtype;
  ev events%rowtype;
  promoted event_bookings%rowtype;
  who profiles%rowtype;
  held boolean;
begin
  if uid is null then
    raise exception 'log in first';
  end if;

  select * into b from event_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking not found';
  end if;
  if b.user_id <> uid and not has_role(uid, 'committee') then
    raise exception 'that is not your booking';
  end if;
  if b.status = 'cancelled' then
    return null;
  end if;

  select * into ev from events where id = b.event_id for update;
  held := b.status in ('booked', 'attended');

  update event_bookings
     set status = 'cancelled', cancelled_at = now()
   where id = p_booking_id;

  perform audit(
    case when b.user_id = uid then 'booking.cancelled' else 'booking.cancelled_by_club' end,
    'event_bookings', p_booking_id,
    jsonb_build_object('status', b.status),
    jsonb_build_object('event_id', b.event_id, 'event', ev.title, 'user_id', b.user_id)
  );

  if held and ev.capacity is not null and ev.status = 'published' and ev.starts_at > now() then
    select * into promoted
      from event_bookings
     where event_id = b.event_id and status = 'waitlist'
     order by booked_at asc
     limit 1
     for update skip locked;
    if found then
      update event_bookings set status = 'booked' where id = promoted.id;
      perform audit('booking.promoted', 'event_bookings', promoted.id,
        jsonb_build_object('status', 'waitlist'),
        jsonb_build_object('event_id', b.event_id, 'event', ev.title, 'user_id', promoted.user_id));
      select * into who from profiles where user_id = promoted.user_id;
      return jsonb_build_object(
        'user_id', promoted.user_id,
        'email', who.email,
        'name', trim(coalesce(who.first_name, '') || ' ' || coalesce(who.last_name, ''))
      );
    end if;
  end if;
  return null;
end;
$$;

-- Live counts for the event page ("8 confirmed · 4 places left"). Numbers
-- only — never names — so it is safe for anyone to call.
create or replace function event_attendance(p_event_id uuid)
returns table (confirmed int, waitlist int, capacity int)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*)::int from event_bookings
      where event_id = p_event_id and status in ('booked', 'attended')),
    (select count(*)::int from event_bookings
      where event_id = p_event_id and status = 'waitlist'),
    (select e.capacity from events e where e.id = p_event_id);
$$;
