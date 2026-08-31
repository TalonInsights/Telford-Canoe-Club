-- P1-06 / P1-07 — membership views and the role-change function.
--
-- Decision 7 (STATUS.md): the spec asked for a security-INVOKER view, but
-- profiles RLS is own-row-only, so an invoker view would show each member
-- only themself — contradicting §5.4 "others: name only via current_members
-- view". These views therefore run as DEFINER and carry their own gate:
-- current members and committee may read current_members; membership_history
-- is committee-only (it exists for the admin segment builder).

create view current_members
with (security_barrier)
as
select p.user_id,
       p.first_name,
       p.last_name,
       p.email,
       p.role,
       is_junior(p.date_of_birth) as is_junior,
       m.id as membership_id,
       m.tier,
       m.status,
       m.paid_at,
       m.source,
       mp.label as period
from profiles p
join membership_members mm on mm.user_id = p.user_id
join memberships m on m.id = mm.membership_id and m.status = 'active'
join membership_periods mp on mp.id = m.period_id and mp.is_current
where p.deactivated_at is null
  and (is_current_member(auth.uid()) or has_role(auth.uid(), 'committee'));

-- Every person × every period with a status or 'none' — the "who was a
-- member in 2023" query surface for filters and segments.
create view membership_history
with (security_barrier)
as
select p.user_id,
       p.first_name,
       p.last_name,
       p.email,
       is_junior(p.date_of_birth) as is_junior,
       mp.id as period_id,
       mp.label as period,
       coalesce(m.status::text, 'none') as status,
       m.tier,
       m.paid_at,
       m.source
from profiles p
cross join membership_periods mp
left join membership_members mm
  on mm.user_id = p.user_id
left join memberships m
  on m.id = mm.membership_id and m.period_id = mp.id
where has_role(auth.uid(), 'committee');

grant select on current_members to authenticated;
grant select on membership_history to authenticated;

-- §5.4 footnote: role changes only via this admin-gated definer function.
create or replace function set_user_role(target uuid, new_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin') then
    raise exception 'only admins can change roles';
  end if;
  perform set_config('app.role_change_authorised', 'yes', true);
  update profiles set role = new_role where user_id = target;
  perform set_config('app.role_change_authorised', '', true);
end;
$$;
