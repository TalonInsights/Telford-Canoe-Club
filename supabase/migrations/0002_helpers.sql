-- P1-07 (part) — helper functions, created before any table so every table's
-- RLS policies can reference them in the migration that creates the table
-- (§0 rule 10: RLS on from the moment a table exists). PL/pgSQL bodies are
-- not validated against yet-to-exist tables at create time.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ordinal role comparison: registered < member < committee < admin.
create or replace function has_role(uid uuid, min app_role)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  r app_role;
begin
  select role into r from profiles where user_id = uid and deactivated_at is null;
  if r is null then
    return false;
  end if;
  return array_position(enum_range(null::app_role), r)
      >= array_position(enum_range(null::app_role), min);
end;
$$;

-- Spec §5.2 correction (SPEC-VALIDATION §1.2): juniorness is computed, never
-- stored — a generated column over now() is invalid and would go stale.
create or replace function is_junior(dob date)
returns boolean
language sql
immutable
as $$
  select dob is not null and dob > (current_date - interval '18 years');
$$;

create or replace function is_current_member(uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from membership_members mm
    join memberships m on m.id = mm.membership_id and m.status = 'active'
    join membership_periods mp on mp.id = m.period_id and mp.is_current
    where mm.user_id = uid
  );
end;
$$;
