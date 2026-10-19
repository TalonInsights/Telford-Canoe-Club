-- Junior turns 18 on a family membership (Simon 5.4). A child covered by a
-- family membership who reaches 18 needs their own membership, so the
-- committee is told. We flag each person once — a notified marker stops the
-- alert repeating — and the alert itself is an audit row, so it joins the
-- change log and is traceable there alongside whatever membership the person
-- is later given (their type change is already audited when it is created).
alter table membership_members
  add column if not exists turned18_notified_at timestamptz;

-- Finds covered members (no account of their own) on an active, current-period
-- family membership whose 18th birthday is RECENT — turned 18 within the last
-- 100 days — and flags them once. The recency window matters: a family
-- membership also covers adult partners, who are well over 18, so "everyone
-- 18+" would wrongly flag a parent. Only a genuine just-turned-18 falls in the
-- window. Records an audit row for each, marks them, and returns them. Definer
-- so the cron can run it with the service key; it writes nothing a committee
-- member could not already see.
create or replace function flag_junior_18()
returns table (membership_id uuid, member_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select mm.id as member_id, mm.membership_id, mm.display_name
    from membership_members mm
    join memberships m on m.id = mm.membership_id and m.status = 'active'
    join membership_periods mp on mp.id = m.period_id and mp.is_current
    left join membership_types mt on mt.id = m.membership_type_id
    where mm.user_id is null
      and mm.date_of_birth is not null
      and mm.date_of_birth <= (current_date - interval '18 years')
      and mm.date_of_birth >  (current_date - interval '18 years' - interval '100 days')
      and mm.turned18_notified_at is null
      and ((m.tier = 'family') or coalesce(mt.covers_family, false))
  loop
    update membership_members set turned18_notified_at = now() where id = rec.member_id;
    perform audit(
      'membership.junior_turned_18', 'membership_members', rec.member_id, null,
      jsonb_build_object('membership_id', rec.membership_id, 'name', rec.display_name)
    );
    membership_id := rec.membership_id;
    member_id := rec.member_id;
    display_name := rec.display_name;
    return next;
  end loop;
end;
$$;
