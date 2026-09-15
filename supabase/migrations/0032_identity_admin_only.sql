-- Names and dates of birth are admin-only once an account exists.
--
-- Client ruling, 15 Sep 2026, tightening what 0031 shipped. That version let a
-- member rename themselves freely and fill in a blank date of birth, and let
-- any committee member change either. The club's position is that both are
-- fixed at sign-up: they are what a membership record is keyed on to a human
-- being, they decide junior status and therefore safeguarding, and a quiet
-- change to one is the kind of thing that is only noticed much later.
--
-- So the rule is now the same for everybody signed in, member and committee
-- alike, and only an admin is exempt. Enforced here rather than only in the
-- forms, so it holds for a screen nobody has written yet.
--
-- A change made with nobody signed in is still allowed. That is not a hole:
-- an authenticated request always carries a uid, so a null one means the
-- service key — a migration, a legacy import, or us fixing data by hand — and
-- blocking that would leave no way to correct an imported record at all. It is
-- still recorded, as `profile.updated_by_system`.

create or replace function guard_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.first_name is distinct from old.first_name
       or new.last_name is distinct from old.last_name
       or new.date_of_birth is distinct from old.date_of_birth)
     and auth.uid() is not null
     and not has_role(auth.uid(), 'admin') then
    raise exception 'names and dates of birth are changed by an admin, ask the committee';
  end if;
  return new;
end;
$$;

-- Replaces the narrower date-of-birth guard from 0031.
drop trigger if exists profiles_guard_dob on profiles;
drop function if exists guard_date_of_birth();

create trigger profiles_guard_identity
  before update on profiles
  for each row execute function guard_identity_change();
