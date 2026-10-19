-- Add a child (or other family member) to a family membership after it was
-- bought (Simon 5.3): a parent adds one at sign-up, forgets the second, and
-- needs to add it later without the committee. The main member on the
-- membership, or the committee, may add; the membership must actually cover a
-- family; nobody else can touch it.
--
-- Security definer so the insert into membership_members is allowed, with the
-- authorisation decided in the body — a plain member has no direct write to
-- that table.
create or replace function add_family_member(
  p_membership_id uuid,
  p_name text,
  p_dob date default null,
  p_emergency_name text default null,
  p_emergency_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m memberships%rowtype;
  covers boolean;
  members_count int;
  clean_name text := trim(coalesce(p_name, ''));
  new_id uuid;
begin
  if uid is null then
    raise exception 'log in first';
  end if;
  if length(clean_name) < 2 then
    raise exception 'enter the name of the person you are adding';
  end if;

  select * into m from memberships where id = p_membership_id;
  if not found then
    raise exception 'that membership was not found';
  end if;

  if uid <> m.primary_user_id and not has_role(uid, 'committee') then
    raise exception 'only the main member or the committee can add to this membership';
  end if;

  covers := (m.tier = 'family');
  if not covers and m.membership_type_id is not null then
    select coalesce(covers_family, false) into covers from membership_types where id = m.membership_type_id;
  end if;
  if not covers then
    raise exception 'this membership does not cover a family';
  end if;

  if m.status not in ('active', 'pending') then
    raise exception 'this membership is not active';
  end if;

  select count(*) into members_count from membership_members where membership_id = p_membership_id;
  if members_count >= 10 then
    raise exception 'this membership already lists the most people it can hold';
  end if;

  insert into membership_members
    (membership_id, display_name, date_of_birth, is_junior, emergency_contact_name, emergency_contact_phone)
  values
    (p_membership_id, clean_name, p_dob, is_junior(p_dob),
     nullif(trim(coalesce(p_emergency_name, '')), ''),
     nullif(trim(coalesce(p_emergency_phone, '')), ''))
  returning id into new_id;

  perform audit(
    'membership.family_member_added', 'membership_members', new_id, null,
    jsonb_build_object('membership_id', p_membership_id, 'is_junior', is_junior(p_dob))
  );
  return new_id;
end;
$$;
