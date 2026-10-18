-- Car registration on the member record (Simon 5.2): so a vehicle left on site
-- can be identified. It is personal data, and it needs no special machinery to
-- protect it — profiles RLS already limits every row to its owner and the
-- committee, so a member never sees another member's registration and the
-- public never sees any. The owner enters their own; committee and admin see
-- it on the member record.
alter table profiles add column if not exists car_registration text;

-- Log that it changed, never the value — the same treatment as phone and
-- address (0031, decision D2). The audit log must not become a second store of
-- plate numbers; "car registration changed" is all the trail needs.
create or replace function audited_profile_columns()
returns text[]
language sql
immutable
as $$
  select array[
    'first_name', 'last_name', 'date_of_birth', 'email_opt_in',
    'bc_membership_number', 'deactivated_at', 'phone', 'address_line1',
    'address_line2', 'town', 'postcode', 'emergency_contact_name',
    'emergency_contact_phone', 'guardian_name', 'guardian_phone',
    'car_registration'
  ];
$$;
