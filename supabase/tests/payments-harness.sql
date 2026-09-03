-- Payments harness (Phase 4) — proves the ENTIRE membership loop end to end
-- on the live database with the simulated gateway: request → begin online →
-- capture → active → promoted → visible in current_members → audited; plus
-- idempotency, foreign-capture refusal, the payment_provider mode gate,
-- abandon, renewal into the next period, admin create/extend, and the
-- expiry sweep. Same mechanism as rls-harness.sql (set local role +
-- request.jwt.claims — what PostgREST does). Run as superuser; idempotent;
-- the final SELECT is the report.

-- ---------------------------------------------------------------- cleanup
delete from audit_log where actor_user_id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003');
delete from membership_members where membership_id in (
  select id from memberships where primary_user_id in (
    '40000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002'));
delete from memberships where primary_user_id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002');
delete from membership_periods where label = 'PAY-2024';
delete from auth.users where email like 'pay-%@test.invalid';
update club_settings set payment_provider = 'simulated' where id;

-- ---------------------------------------------------------------- users
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, extensions.crypt('pay-harness-only', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('first_name', u.fn, 'last_name', 'Paytest'),
       now(), now()
from (values
  ('40000000-0000-4000-8000-000000000001'::uuid, 'pay-alice@test.invalid', 'Alice'),
  ('40000000-0000-4000-8000-000000000002'::uuid, 'pay-bob@test.invalid', 'Bob'),
  ('40000000-0000-4000-8000-000000000003'::uuid, 'pay-cara@test.invalid', 'Cara')
) as u(id, email, fn);

select set_config('app.role_change_authorised', 'yes', true);
update profiles set role = 'committee' where user_id = '40000000-0000-4000-8000-000000000003';
select set_config('app.role_change_authorised', '', true);

-- ---------------------------------------------------------------- helpers
create temp table results (n serial, test text, expected text, actual text, pass boolean);

create or replace function pg_temp.impersonate(uid uuid)
returns void language plpgsql as $$
begin
  if uid is null then
    execute 'set local role anon';
    perform set_config('request.jwt.claims', '', true);
  else
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
  end if;
end;
$$;

create or replace function pg_temp.check_true(test text, cond boolean)
returns void language plpgsql as $$
begin
  insert into results (test, expected, actual, pass)
  values (test, 'true', coalesce(cond::text, 'null'), coalesce(cond, false));
end;
$$;

create or replace function pg_temp.check_denied(test text, uid uuid, stmt text)
returns void language plpgsql as $$
declare
  denied boolean := false;
begin
  perform pg_temp.impersonate(uid);
  begin
    execute stmt;
  exception when others then
    denied := true;
  end;
  reset role;
  insert into results (test, expected, actual, pass)
  values (test, 'denied', case when denied then 'denied' else 'ALLOWED' end, denied);
end;
$$;

-- ---------------------------------------------------------------- scenario
do $pay$
declare
  alice uuid := '40000000-0000-4000-8000-000000000001';
  bob   uuid := '40000000-0000-4000-8000-000000000002';
  cara  uuid := '40000000-0000-4000-8000-000000000003';
  mem_alice uuid;
  mem_alice_2027 uuid;
  mem_bob uuid;
  mem_bob_admin uuid;
  mem_extended uuid;
  ret uuid;
  period_2027 uuid;
  period_past uuid;
  sweep jsonb;
  r record;
begin
  select id into period_2027 from membership_periods where label = '2027';

  -- 1 ▸ anon can do nothing
  perform pg_temp.check_denied('anon cannot request a membership', null,
    'select request_membership(''adult'')');
  perform pg_temp.check_denied('anon cannot capture', null,
    'select complete_online_payment(''SIM-X-00000000'', ''SIMCAP-0000000000'')');

  -- 2 ▸ Alice requests an adult membership (price from settings)
  perform pg_temp.impersonate(alice);
  mem_alice := request_membership('adult');
  reset role;
  select * into r from memberships where id = mem_alice;
  perform pg_temp.check_true('request creates a pending row', r.status = 'pending');
  perform pg_temp.check_true('price came from club_settings',
    r.amount_pence = (select price_adult_pence from club_settings where id));

  -- 3 ▸ Alice begins an online payment; Bob cannot touch it
  perform pg_temp.impersonate(alice);
  perform begin_online_payment(mem_alice, 'SIM-2026-HARNESS1');
  reset role;
  select * into r from memberships where id = mem_alice;
  perform pg_temp.check_true('begin stamps source=paypal + order ref',
    r.source = 'paypal' and r.paypal_order_id = 'SIM-2026-HARNESS1');
  perform pg_temp.check_denied('another user cannot begin on my membership', bob,
    format('select begin_online_payment(%L, ''SIM-2026-EVIL0001'')', mem_alice));
  perform pg_temp.check_denied('another user cannot capture my order', bob,
    'select complete_online_payment(''SIM-2026-HARNESS1'', ''SIMCAP-EVIL000001'')');

  -- 4 ▸ Alice captures (simulated) → active, paid, promoted
  perform pg_temp.impersonate(alice);
  ret := complete_online_payment('SIM-2026-HARNESS1', 'SIMCAP-HARNESS001');
  reset role;
  select * into r from memberships where id = mem_alice;
  perform pg_temp.check_true('capture returns the membership id', ret = mem_alice);
  perform pg_temp.check_true('capture activates with paid_at + capture ref',
    r.status = 'active' and r.paid_at is not null and r.paypal_capture_id = 'SIMCAP-HARNESS001');
  perform pg_temp.check_true('first activation promotes registered → member',
    (select role from profiles where user_id = alice) = 'member');
  perform pg_temp.check_true('is_current_member() now true for Alice',
    is_current_member(alice));

  -- 5 ▸ committee sees Alice in current_members
  perform pg_temp.impersonate(cara);
  perform pg_temp.check_true('committee sees Alice in current_members',
    exists (select 1 from current_members where user_id = alice));
  reset role;

  -- 6 ▸ idempotent replay; different-capture replay refused
  perform pg_temp.impersonate(alice);
  ret := complete_online_payment('SIM-2026-HARNESS1', 'SIMCAP-HARNESS001');
  reset role;
  perform pg_temp.check_true('replaying the same capture is idempotent', ret = mem_alice);
  perform pg_temp.check_true('still exactly one membership row for Alice',
    (select count(*) from memberships where primary_user_id = alice) = 1);
  perform pg_temp.check_denied('same order with a different capture ref is refused', alice,
    'select complete_online_payment(''SIM-2026-HARNESS1'', ''SIMCAP-DIFFERENT1'')');

  -- 7 ▸ audit trail for the whole journey
  perform pg_temp.check_true('audit: requested + order_created + paid_online all logged',
    (select count(distinct action) from audit_log
     where entity_id = mem_alice
       and action in ('membership.requested', 'payment.order_created', 'membership.paid_online')) = 3);

  -- 8 ▸ renewal: active-in-2026 Alice can request 2027 (family, named)
  perform pg_temp.impersonate(alice);
  mem_alice_2027 := request_membership('family', array['Finn Paytest', 'Mara Paytest'], period_2027);
  reset role;
  perform pg_temp.check_true('renewal request lands pending in 2027',
    (select status from memberships where id = mem_alice_2027) = 'pending'
    and (select period_id from memberships where id = mem_alice_2027) = period_2027);
  perform pg_temp.check_true('family names covered (self + 2)',
    (select count(*) from membership_members where membership_id = mem_alice_2027) = 3);
  perform pg_temp.check_denied('but a second 2026 request while active is refused', alice,
    'select request_membership(''adult'')');

  -- 9 ▸ the mode gate: in paypal mode self-capture is refused at the DB
  update club_settings set payment_provider = 'paypal' where id;
  perform pg_temp.impersonate(alice);
  perform begin_online_payment(mem_alice_2027, 'SIM-2027-HARNESS2');
  reset role;
  perform pg_temp.check_denied('provider=paypal → simulated self-capture refused', alice,
    'select complete_online_payment(''SIM-2027-HARNESS2'', ''SIMCAP-HARNESS002'')');
  update club_settings set payment_provider = 'off' where id;
  perform pg_temp.check_denied('provider=off → beginning an online payment refused', alice,
    format('select begin_online_payment(%L, ''SIM-2027-HARNESS3'')', mem_alice_2027));
  update club_settings set payment_provider = 'simulated' where id;

  -- 10 ▸ abandon returns the order to the treasurer path
  perform pg_temp.impersonate(alice);
  perform abandon_online_payment('SIM-2027-HARNESS2');
  reset role;
  select * into r from memberships where id = mem_alice_2027;
  perform pg_temp.check_true('abandon reverts to manual_bank and clears the ref',
    r.source = 'manual_bank' and r.paypal_order_id is null and r.status = 'pending');

  -- 11 ▸ admin create: Bob walks up with cash; Cara records him directly
  perform pg_temp.impersonate(bob);
  mem_bob := request_membership('junior');
  reset role;
  perform pg_temp.check_denied('non-committee cannot admin-create', alice,
    format('select admin_create_membership(%L, ''adult'', (select id from membership_periods where is_current), ''manual_cash'')', bob));
  perform pg_temp.impersonate(cara);
  mem_bob_admin := admin_create_membership(
    bob, 'junior', (select id from membership_periods where is_current),
    'manual_cash', null, true, 'walk-up cash — harness');
  reset role;
  perform pg_temp.check_true('admin create reuses the pending row (no stacking)',
    mem_bob_admin = mem_bob);
  select * into r from memberships where id = mem_bob_admin;
  perform pg_temp.check_true('admin-created membership is active cash with recorder',
    r.status = 'active' and r.source = 'manual_cash' and r.recorded_by = cara and r.paid_at is not null);
  perform pg_temp.check_true('Bob promoted to member',
    (select role from profiles where user_id = bob) = 'member');

  -- 12 ▸ admin extend: goodwill year for Bob in 2027
  perform pg_temp.impersonate(cara);
  mem_extended := admin_extend_membership(mem_bob_admin, 'goodwill — harness');
  reset role;
  select * into r from memberships where id = mem_extended;
  perform pg_temp.check_true('extension is active complimentary £0 in 2027',
    r.status = 'active' and r.source = 'complimentary' and r.amount_pence = 0
    and r.period_id = period_2027);
  perform pg_temp.check_true('extension carries the covered names',
    (select count(*) from membership_members where membership_id = mem_extended) =
    (select count(*) from membership_members where membership_id = mem_bob_admin));
  perform pg_temp.check_denied('extending twice is refused', cara,
    format('select admin_extend_membership(%L)', mem_bob_admin));

  -- 13 ▸ expiry sweep: a synthetic 2024 period expires; live rows untouched
  insert into membership_periods (label, starts_on, ends_on, is_current)
  values ('PAY-2024', '2024-01-01', '2024-12-31', false)
  returning id into period_past;
  insert into memberships (period_id, tier, status, primary_user_id, amount_pence, source, paid_at)
  values (period_past, 'adult', 'active', bob, 2500, 'manual_cash', '2024-01-05');
  perform pg_temp.impersonate(cara);
  sweep := run_expiry_sweep();
  reset role;
  perform pg_temp.check_true('sweep expired exactly the 2024 row',
    (sweep->>'expired')::int = 1
    and (select status from memberships where period_id = period_past and primary_user_id = bob) = 'expired');
  perform pg_temp.check_true('sweep left 2026 memberships active and current',
    (select status from memberships where id = mem_alice) = 'active'
    and (select label from membership_periods where is_current) = '2026');
  perform pg_temp.check_true('sweep is idempotent',
    ((run_expiry_sweep())->>'expired')::int = 0);
end;
$pay$;

-- ---------------------------------------------------------------- report
-- One result set (the SQL API returns the last statement only): the verdict
-- row first, then ONLY failing assertions — empty tail = everything passed.
select * from (
  select -1 as n,
         (select case when count(*) filter (where not pass) = 0
                      then format('PAYMENTS HARNESS: ALL %s PASS', count(*))
                      else format('PAYMENTS HARNESS: %s of %s FAILED',
                                  count(*) filter (where not pass), count(*))
                 end
          from results) as test,
         '' as expected, '' as actual,
         (select count(*) filter (where not pass) = 0 from results) as pass
  union all
  select n, test, expected, actual, pass from results where not pass
) report order by n;
