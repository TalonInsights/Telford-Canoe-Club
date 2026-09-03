-- Payments harness (Phase 4) — proves the ENTIRE membership loop end to end
-- on the live database with the simulated gateway: request → begin online →
-- capture → active → promoted → visible in current_members → audited; plus
-- idempotency, foreign-capture refusal, the payment_provider mode gate,
-- abandon, renewal into the next period, admin create/extend, and the
-- expiry sweep. Same impersonation mechanism as rls-harness.sql (set local
-- role + request.jwt.claims — what PostgREST does).
--
-- REUSES the four rls-harness users (run rls-harness.sql first if they are
-- missing) — this file never writes auth.users:
--   …0001 Reg (registered)  → the buyer's full journey
--   …0002 Mem (member, has the active 2026 rls fixture) → attacker + extend
--   …0003 Com (committee)   → records payments, extends, sweeps
--   …0004 Adm (admin)       → the walk-up cash payer
-- Idempotent: cleans its own leavings first. Run as superuser; the final
-- SELECT is the report (verdict row + any failing assertions).

-- ---------------------------------------------------------------- cleanup
delete from audit_log
where actor_user_id in ('10000000-0000-4000-8000-000000000001',
                        '10000000-0000-4000-8000-000000000002',
                        '10000000-0000-4000-8000-000000000003',
                        '10000000-0000-4000-8000-000000000004')
  and (action like 'payment.%' or action like 'membership.%');

with pay_mems as (
  select id from memberships
  where paypal_order_id like 'SIM-%'
     or paypal_capture_id like 'SIMCAP-%'
     or notes like '%(harness)%'
     or period_id in (select id from membership_periods where label = 'PAY-2024')
     or (period_id in (select id from membership_periods where label = '2027')
         and primary_user_id in ('10000000-0000-4000-8000-000000000001',
                                 '10000000-0000-4000-8000-000000000002',
                                 '10000000-0000-4000-8000-000000000004'))
     or (primary_user_id = '10000000-0000-4000-8000-000000000001')
     or (primary_user_id = '10000000-0000-4000-8000-000000000004' and notes is distinct from 'rls-fixture')
)
delete from membership_members where membership_id in (select id from pay_mems);

delete from memberships
where paypal_order_id like 'SIM-%'
   or paypal_capture_id like 'SIMCAP-%'
   or notes like '%(harness)%'
   or period_id in (select id from membership_periods where label = 'PAY-2024')
   or (period_id in (select id from membership_periods where label = '2027')
       and primary_user_id in ('10000000-0000-4000-8000-000000000001',
                               '10000000-0000-4000-8000-000000000002',
                               '10000000-0000-4000-8000-000000000004'))
   or (primary_user_id = '10000000-0000-4000-8000-000000000001')
   or (primary_user_id = '10000000-0000-4000-8000-000000000004' and notes is distinct from 'rls-fixture');

delete from membership_periods where label = 'PAY-2024';

select set_config('app.role_change_authorised', 'yes', true);
update profiles set role = 'registered' where user_id = '10000000-0000-4000-8000-000000000001';
select set_config('app.role_change_authorised', '', true);

update club_settings set payment_provider = 'simulated' where id;

-- ---------------------------------------------------------------- helpers
-- drop-first: pooled dashboard connections can retain a temp table from an
-- earlier harness run (this exact failure has happened — a stale `results`
-- from the P1-17 session 400'd the whole batch).
drop table if exists pg_temp.results;
create temp table results (n serial, test text, expected text, actual text, pass boolean);

create or replace function pg_temp.impersonate(uid uuid)
returns void language plpgsql as $fn$
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
$fn$;

create or replace function pg_temp.check_true(test text, cond boolean)
returns void language plpgsql as $fn$
begin
  insert into results (test, expected, actual, pass)
  values (test, 'true', coalesce(cond::text, 'null'), coalesce(cond, false));
end;
$fn$;

create or replace function pg_temp.check_denied(test text, uid uuid, stmt text)
returns void language plpgsql as $fn$
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
$fn$;

-- ---------------------------------------------------------------- scenario
do $pay$
declare
  buyer uuid := '10000000-0000-4000-8000-000000000001'; -- Reg
  other uuid := '10000000-0000-4000-8000-000000000002'; -- Mem (attacker / extend target)
  com   uuid := '10000000-0000-4000-8000-000000000003'; -- committee
  adm   uuid := '10000000-0000-4000-8000-000000000004'; -- walk-up cash payer
  mem_buyer uuid;
  mem_buyer_2027 uuid;
  mem_adm uuid;
  mem_adm_admin uuid;
  mem_other_fixture uuid;
  mem_extended uuid;
  ret uuid;
  period_2027 uuid;
  period_past uuid;
  sweep jsonb;
  r record;
  seen boolean;
begin
  select id into period_2027 from membership_periods where label = '2027';
  select id into mem_other_fixture from memberships
  where primary_user_id = other and notes = 'rls-fixture' limit 1;

  -- 1 ▸ anon can do nothing
  perform pg_temp.check_denied('anon cannot request a membership', null,
    'select request_membership(''adult'')');
  perform pg_temp.check_denied('anon cannot capture', null,
    'select complete_online_payment(''SIM-X-00000000'', ''SIMCAP-0000000000'')');

  -- 2 ▸ the buyer requests an adult membership (price from settings)
  perform pg_temp.impersonate(buyer);
  mem_buyer := request_membership('adult');
  reset role;
  select * into r from memberships where id = mem_buyer;
  perform pg_temp.check_true('request creates a pending row', r.status = 'pending');
  perform pg_temp.check_true('price came from club_settings',
    r.amount_pence = (select price_adult_pence from club_settings where id));

  -- 3 ▸ buyer begins an online payment; another member cannot touch it
  perform pg_temp.impersonate(buyer);
  perform begin_online_payment(mem_buyer, 'SIM-2026-HARNESS1');
  reset role;
  select * into r from memberships where id = mem_buyer;
  perform pg_temp.check_true('begin stamps source=paypal + order ref',
    r.source = 'paypal' and r.paypal_order_id = 'SIM-2026-HARNESS1');
  perform pg_temp.check_denied('another user cannot begin on my membership', other,
    format('select begin_online_payment(%L, ''SIM-2026-EVIL0001'')', mem_buyer));
  perform pg_temp.check_denied('another user cannot capture my order', other,
    'select complete_online_payment(''SIM-2026-HARNESS1'', ''SIMCAP-EVIL000001'')');

  -- 4 ▸ buyer captures (simulated) → active, paid, promoted
  perform pg_temp.impersonate(buyer);
  ret := complete_online_payment('SIM-2026-HARNESS1', 'SIMCAP-HARNESS001');
  reset role;
  select * into r from memberships where id = mem_buyer;
  perform pg_temp.check_true('capture returns the membership id', ret = mem_buyer);
  perform pg_temp.check_true('capture activates with paid_at + capture ref',
    r.status = 'active' and r.paid_at is not null and r.paypal_capture_id = 'SIMCAP-HARNESS001');
  perform pg_temp.check_true('first activation promotes registered to member',
    (select role from profiles where user_id = buyer) = 'member');
  perform pg_temp.check_true('is_current_member() now true for the buyer',
    is_current_member(buyer));

  -- 5 ▸ committee sees the buyer in current_members
  -- (evaluate while impersonated, assert after reset — the impersonated role
  -- has no rights on the postgres-owned temp results table)
  perform pg_temp.impersonate(com);
  select exists (select 1 from current_members where user_id = buyer) into seen;
  reset role;
  perform pg_temp.check_true('committee sees the buyer in current_members', seen);

  -- 6 ▸ idempotent replay; different-capture replay refused
  perform pg_temp.impersonate(buyer);
  ret := complete_online_payment('SIM-2026-HARNESS1', 'SIMCAP-HARNESS001');
  reset role;
  perform pg_temp.check_true('replaying the same capture is idempotent', ret = mem_buyer);
  perform pg_temp.check_true('still exactly one membership row for the buyer',
    (select count(*) from memberships where primary_user_id = buyer) = 1);
  perform pg_temp.check_denied('same order with a different capture ref is refused', buyer,
    'select complete_online_payment(''SIM-2026-HARNESS1'', ''SIMCAP-DIFFERENT1'')');

  -- 7 ▸ audit trail for the whole journey
  perform pg_temp.check_true('audit: requested + order_created + paid_online all logged',
    (select count(distinct action) from audit_log
     where entity_id = mem_buyer
       and action in ('membership.requested', 'payment.order_created', 'membership.paid_online')) = 3);

  -- 8 ▸ renewal: active-in-2026 buyer can request 2027 (family, named)
  perform pg_temp.impersonate(buyer);
  mem_buyer_2027 := request_membership('family', array['Finn Harness', 'Mara Harness'], period_2027);
  reset role;
  perform pg_temp.check_true('renewal request lands pending in 2027',
    (select status from memberships where id = mem_buyer_2027) = 'pending'
    and (select period_id from memberships where id = mem_buyer_2027) = period_2027);
  perform pg_temp.check_true('family names covered (self + 2)',
    (select count(*) from membership_members where membership_id = mem_buyer_2027) = 3);
  perform pg_temp.check_denied('but a second 2026 request while active is refused', buyer,
    'select request_membership(''adult'')');

  -- 9 ▸ the mode gate: in paypal mode self-capture is refused at the DB
  update club_settings set payment_provider = 'paypal' where id;
  perform pg_temp.impersonate(buyer);
  perform begin_online_payment(mem_buyer_2027, 'SIM-2027-HARNESS2');
  reset role;
  perform pg_temp.check_denied('provider=paypal: simulated self-capture refused', buyer,
    'select complete_online_payment(''SIM-2027-HARNESS2'', ''SIMCAP-HARNESS002'')');
  update club_settings set payment_provider = 'off' where id;
  perform pg_temp.check_denied('provider=off: beginning an online payment refused', buyer,
    format('select begin_online_payment(%L, ''SIM-2027-HARNESS3'')', mem_buyer_2027));
  update club_settings set payment_provider = 'simulated' where id;

  -- 10 ▸ abandon returns the order to the treasurer path
  perform pg_temp.impersonate(buyer);
  perform abandon_online_payment('SIM-2027-HARNESS2');
  reset role;
  select * into r from memberships where id = mem_buyer_2027;
  perform pg_temp.check_true('abandon reverts to manual_bank and clears the ref',
    r.source = 'manual_bank' and r.paypal_order_id is null and r.status = 'pending');

  -- 11 ▸ admin create: the walk-up cash payer, recorded by the committee
  perform pg_temp.impersonate(adm);
  mem_adm := request_membership('junior');
  reset role;
  perform pg_temp.check_denied('non-committee cannot admin-create', buyer,
    format('select admin_create_membership(%L, ''adult'', (select id from membership_periods where is_current), ''manual_cash'')', adm));
  perform pg_temp.impersonate(com);
  mem_adm_admin := admin_create_membership(
    adm, 'junior', (select id from membership_periods where is_current),
    'manual_cash', null, true, 'walk-up cash (harness)');
  reset role;
  perform pg_temp.check_true('admin create reuses the pending row (no stacking)',
    mem_adm_admin = mem_adm);
  select * into r from memberships where id = mem_adm_admin;
  perform pg_temp.check_true('admin-created membership is active cash with recorder',
    r.status = 'active' and r.source = 'manual_cash' and r.recorded_by = com and r.paid_at is not null);

  -- 12 ▸ admin extend: goodwill 2027 for the fixture member
  perform pg_temp.impersonate(com);
  mem_extended := admin_extend_membership(mem_other_fixture, 'goodwill (harness)');
  reset role;
  select * into r from memberships where id = mem_extended;
  perform pg_temp.check_true('extension is active complimentary at 0p in 2027',
    r.status = 'active' and r.source = 'complimentary' and r.amount_pence = 0
    and r.period_id = period_2027);
  perform pg_temp.check_true('extension carries the covered names',
    (select count(*) from membership_members where membership_id = mem_extended) =
    (select count(*) from membership_members where membership_id = mem_other_fixture));
  perform pg_temp.check_denied('extending twice is refused', com,
    format('select admin_extend_membership(%L)', mem_other_fixture));

  -- 13 ▸ expiry sweep: a synthetic 2024 period expires; live rows untouched
  insert into membership_periods (label, starts_on, ends_on, is_current)
  values ('PAY-2024', '2024-01-01', '2024-12-31', false)
  returning id into period_past;
  insert into memberships (period_id, tier, status, primary_user_id, amount_pence, source, paid_at, notes)
  values (period_past, 'adult', 'active', adm, 2500, 'manual_cash', '2024-01-05', 'sweep target (harness)');
  perform pg_temp.impersonate(com);
  sweep := run_expiry_sweep();
  reset role;
  perform pg_temp.check_true('sweep expired exactly the 2024 row',
    (sweep->>'expired')::int = 1
    and (select status from memberships where period_id = period_past and primary_user_id = adm) = 'expired');
  perform pg_temp.check_true('sweep left 2026 memberships active and current',
    (select status from memberships where id = mem_buyer) = 'active'
    and (select label from membership_periods where is_current) = '2026');
  perform pg_temp.check_true('sweep is idempotent',
    ((run_expiry_sweep())->>'expired')::int = 0);
exception when others then
  -- a scenario crash becomes a failing report row instead of a 400 batch
  insert into results (test, expected, actual, pass)
  values ('SCENARIO ERROR: ' || sqlerrm, 'no-error', sqlstate, false);
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
