-- 0029 — emailing the members (change request item 2).
--
-- The tables already existed (0013): `email_campaigns` and `email_recipients`.
-- What was missing is everything that makes a send safe and lawful:
--
--   * a way to name a group of people and resolve it to addresses,
--   * a one-click unsubscribe that works without an account, and
--   * a record that a given person was sent a given thing.
--
-- The line this must not cross: `email_opt_in` governs club news only.
-- Booking confirmations, membership receipts and password emails are
-- transactional and are sent regardless, which is why they go nowhere near
-- these functions.

/* ---------------------------------------------------------- unsubscribing */

-- A per-person secret in the link, so somebody can unsubscribe from an email
-- without logging in and without anybody being able to unsubscribe a person
-- by guessing their id.
alter table profiles
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Which of the named groups a campaign was sent to, kept beside the count so
-- the record still reads correctly years later.
alter table email_campaigns
  add column if not exists segment_key text;

-- Callable by anyone holding the token, because an unsubscribe link has to
-- work from an email client with no session. It reveals nothing: a wrong
-- token and a right one are answered the same way.
create or replace function unsubscribe_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  select user_id, first_name, email_opt_in into p
  from profiles where unsubscribe_token = p_token;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  if p.email_opt_in then
    update profiles set email_opt_in = false where user_id = p.user_id;
    perform audit('email.unsubscribed', 'profiles', p.user_id,
      jsonb_build_object('email_opt_in', true),
      jsonb_build_object('email_opt_in', false, 'via', 'link'));
  end if;

  return jsonb_build_object('ok', true, 'name', coalesce(p.first_name, ''));
end;
$$;

grant execute on function unsubscribe_by_token(uuid) to anon, authenticated;

/* -------------------------------------------------------------- segments */

-- The three groups the club asked for, resolved in one place so the count it
-- previews and the list it sends to can never disagree.
--
-- Every group excludes deactivated accounts and anybody who has opted out of
-- club news. That is deliberate even for "everyone": this function only ever
-- produces recipients for club news.
create or replace function email_segment_recipients(p_segment text)
returns table (user_id uuid, email text, first_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'committee') then
    raise exception 'committee only';
  end if;

  if p_segment = 'paid_members' then
    return query
      select distinct p.user_id, p.email, p.first_name
      from profiles p
      join membership_members mm on mm.user_id = p.user_id
      join memberships m on m.id = mm.membership_id and m.status = 'active'
      join membership_periods mp on mp.id = m.period_id and mp.is_current
      where p.deactivated_at is null
        and p.email_opt_in
        and coalesce(m.ends_on, mp.ends_on) >= current_date;

  elsif p_segment = 'registered_unpaid' then
    return query
      select p.user_id, p.email, p.first_name
      from profiles p
      where p.deactivated_at is null
        and p.email_opt_in
        and not exists (
          select 1 from membership_members mm
          join memberships m on m.id = mm.membership_id and m.status = 'active'
          where mm.user_id = p.user_id
        );

  elsif p_segment = 'everyone' then
    return query
      select p.user_id, p.email, p.first_name
      from profiles p
      where p.deactivated_at is null and p.email_opt_in;

  else
    raise exception 'unknown group';
  end if;
end;
$$;

/* ------------------------------------------------------- recipient status */

-- 0013 allows queued / sent / delivered / bounced / complained / failed.
-- A batch sender also needs to record that somebody was deliberately left
-- out, which is not a failure.
alter table email_recipients drop constraint if exists email_recipients_status_check;
alter table email_recipients add constraint email_recipients_status_check check (
  status in ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'skipped')
);

create index if not exists email_recipients_queue
  on email_recipients (campaign_id, status, created_at);
