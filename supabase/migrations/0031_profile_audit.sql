-- Member records become editable, so every change to one is recorded.
--
-- The log is a trigger rather than a line in each server action, because a
-- change log written by the app only ever records changes made through the
-- app. This one catches the member's own form, the committee's form, a screen
-- nobody has written yet, and a hand-run UPDATE.
--
-- What it records is deliberately uneven (plan D2). The audit log is permanent
-- and readable by every admin, so copying a member's home address into it on
-- every save would build a second growing store of exactly the personal data
-- the club has promised to minimise — and it would answer no question, because
-- the committee can already see the current value. Where the OLD value is the
-- point (a name, a date of birth, the news opt-in), both values are kept; for
-- contact details only the fact of the change is. Internal and medical notes
-- are not looked at here at all.

-- Values worth keeping. Everything else is recorded by name only.
create or replace function audited_profile_values()
returns text[]
language sql
immutable
as $$
  select array[
    'first_name', 'last_name', 'date_of_birth',
    'email_opt_in', 'bc_membership_number', 'deactivated_at'
  ];
$$;

-- Columns whose changes are worth a line in the log at all. `role` is absent
-- on purpose: set_user_role() writes its own, richer entry, and logging it
-- here as well would double every promotion.
create or replace function audited_profile_columns()
returns text[]
language sql
immutable
as $$
  select array[
    'first_name', 'last_name', 'date_of_birth', 'email_opt_in',
    'bc_membership_number', 'deactivated_at', 'phone', 'address_line1',
    'address_line2', 'town', 'postcode', 'emergency_contact_name',
    'emergency_contact_phone', 'guardian_name', 'guardian_phone'
  ];
$$;

create or replace function audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
  col text;
  changed text[] := '{}';
  before_v jsonb := '{}'::jsonb;
  after_v jsonb := '{}'::jsonb;
  by_self boolean;
begin
  foreach col in array audited_profile_columns() loop
    if o -> col is distinct from n -> col then
      changed := changed || col;
      if col = any (audited_profile_values()) then
        before_v := before_v || jsonb_build_object(col, o -> col);
        after_v := after_v || jsonb_build_object(col, n -> col);
      end if;
    end if;
  end loop;

  if cardinality(changed) = 0 then
    return new;
  end if;

  -- Three cases, not two. A row touched with nobody signed in is the expiry
  -- sweep, an import or a hand-run fix, and blaming that on the committee
  -- would put a change in somebody's name that they did not make.
  by_self := auth.uid() is not null and auth.uid() = new.user_id;

  perform audit(
    case
      when auth.uid() is null then 'profile.updated_by_system'
      when by_self then 'profile.updated'
      else 'profile.updated_by_committee'
    end,
    'profiles',
    new.user_id,
    before_v || jsonb_build_object('fields', to_jsonb(changed)),
    after_v || jsonb_build_object(
      'fields', to_jsonb(changed),
      'name', trim(coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, ''))
    )
  );

  return new;
end;
$$;

create trigger profiles_audit_change
  after update on profiles
  for each row execute function audit_profile_change();

-- Safeguarding (plan D3). Date of birth decides is_junior(), which is what
-- keeps under-18 accounts off the on-site board. A member filling in a blank
-- is completing their own record; a member rewriting one that already exists
-- could switch their own junior status off, so that goes through the
-- committee. In the form as well, but enforced here so it holds everywhere.
create or replace function guard_date_of_birth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.date_of_birth is distinct from old.date_of_birth
     and old.date_of_birth is not null
     and auth.uid() is not null
     and auth.uid() = new.user_id
     and not has_role(auth.uid(), 'committee') then
    raise exception 'a recorded date of birth is changed by the committee, not by the member';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_dob
  before update on profiles
  for each row execute function guard_date_of_birth();

-- Reading the log: it is filtered by kind of action and by date far more often
-- than by anything else, and it only grows.
create index if not exists audit_log_action_time on audit_log (action, created_at desc);
create index if not exists audit_log_time on audit_log (created_at desc);
