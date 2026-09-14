-- Change request follow-up — admins manage admins from the site.
--
-- set_user_role() has existed since 0007 and already let an admin set any
-- role, but nothing in the app ever called it: the two promotions so far were
-- done by hand in SQL. Handing the club the button means the function has to
-- survive being pressed by someone who is not reading the schema, so it gains
-- the three things it was missing.
--
-- 1. An admin cannot change their own role. Stepping down is something the
--    other admin does for you. This is the guard that matters: only admins can
--    call this function, so an admin who demoted themselves while they were
--    the only one would lock the club out of its own site permanently, with no
--    way back that does not involve us and the service-role key.
-- 2. Never leave the club with no active admin. Redundant while (1) holds, and
--    kept anyway, because it states the invariant the club actually cares
--    about rather than the rule that happens to imply it today.
-- 3. An audit row. Every other privileged function in this schema writes one;
--    this is the most sensitive of them and was the only one that did not.
--
-- Unchanged: who may call it, and what roles exist. This adds no power.

create or replace function set_user_role(target uuid, new_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  old_role app_role;
  target_name text;
  admins_left int;
begin
  if not has_role(actor, 'admin') then
    raise exception 'only admins can change roles';
  end if;

  select role, trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
    into old_role, target_name
  from profiles
  where user_id = target;

  if not found then
    raise exception 'no such person';
  end if;

  -- Pressing the button you are already on is not an error, and should not
  -- litter the audit log.
  if old_role = new_role then
    return;
  end if;

  if target = actor then
    raise exception 'you cannot change your own role, ask the other admin to do it';
  end if;

  if old_role = 'admin' and new_role <> 'admin' then
    select count(*) into admins_left
    from profiles
    where role = 'admin'
      and deactivated_at is null
      and user_id <> target;

    if admins_left = 0 then
      raise exception 'that would leave the club with no admin';
    end if;
  end if;

  perform set_config('app.role_change_authorised', 'yes', true);
  update profiles set role = new_role where user_id = target;
  perform set_config('app.role_change_authorised', '', true);

  perform audit(
    'profile.role_changed',
    'profiles',
    target,
    jsonb_build_object('role', old_role),
    jsonb_build_object('role', new_role, 'name', target_name)
  );
end;
$$;
