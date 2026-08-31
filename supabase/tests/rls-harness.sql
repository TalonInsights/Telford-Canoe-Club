-- P1-17 — RLS harness. Creates four users (registered / member / committee /
-- admin), builds fixtures, then asserts every cell of the §5.4 matrix by
-- impersonating each role with `set local role` + request.jwt.claims — the
-- exact mechanism PostgREST uses, so what passes here is what production
-- enforces. Idempotent: cleans its own fixtures first. Run as superuser
-- (dashboard SQL editor or `psql`); the final SELECT is the report. The
-- whole file runs as one batch/transaction — no explicit BEGIN, so the
-- fixtures commit and remain as a browsable test dataset (cleaned and
-- rebuilt on every run).

-- ---------------------------------------------------------------- cleanup
delete from event_bookings where note = 'rls-fixture';
delete from event_media where caption = 'rls-fixture';
delete from events where slug like 'rls-%';
delete from documents where title like 'rls-%';
delete from pages where slug like 'zz-rls-%';
delete from posts where slug like 'rls-%';
delete from notices where title like 'rls-%';
delete from committee_roles where role_title like 'rls-%';
delete from import_batches where source = 'rls-fixture';
delete from membership_members where display_name like 'rls-%';
delete from memberships where notes = 'rls-fixture';
delete from audit_log where action like 'rls-%';
delete from auth.users where email like 'rls-%@test.invalid';

-- ---------------------------------------------------------------- users
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, extensions.crypt('rls-harness-only', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('first_name', u.fn, 'last_name', 'Test'),
       now(), now()
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'rls-registered@test.invalid', 'Reg'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'rls-member@test.invalid', 'Mem'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'rls-committee@test.invalid', 'Com'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'rls-admin@test.invalid', 'Adm')
) as u(id, email, fn);

select set_config('app.role_change_authorised', 'yes', true);
update profiles set role = 'member'    where user_id = '10000000-0000-4000-8000-000000000002';
update profiles set role = 'committee' where user_id = '10000000-0000-4000-8000-000000000003';
update profiles set role = 'admin'     where user_id = '10000000-0000-4000-8000-000000000004';
select set_config('app.role_change_authorised', '', true);

-- ---------------------------------------------------------------- fixtures
insert into memberships (id, period_id, tier, status, primary_user_id, amount_pence, source, paid_at, notes)
select '20000000-0000-4000-8000-00000000000a', id, 'adult', 'active',
       '10000000-0000-4000-8000-000000000002', 2500, 'manual_bank', now(), 'rls-fixture'
from membership_periods where is_current;

insert into memberships (id, period_id, tier, status, primary_user_id, amount_pence, source, paid_at, notes)
select '20000000-0000-4000-8000-00000000000b', id, 'adult', 'active',
       '10000000-0000-4000-8000-000000000003', 2500, 'manual_cash', now(), 'rls-fixture'
from membership_periods where is_current;

insert into membership_members (membership_id, user_id, display_name) values
  ('20000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000002', 'rls-mem'),
  ('20000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-000000000003', 'rls-com');

insert into events (id, slug, title, starts_at, visibility, status) values
  ('30000000-0000-4000-8000-000000000001', 'rls-public', 'rls public event', now() + interval '7 days', 'public', 'published'),
  ('30000000-0000-4000-8000-000000000002', 'rls-members', 'rls members event', now() + interval '8 days', 'members', 'published'),
  ('30000000-0000-4000-8000-000000000003', 'rls-draft', 'rls draft event', now() + interval '9 days', 'public', 'draft');

insert into event_media (event_id, kind, storage_path, caption) values
  ('30000000-0000-4000-8000-000000000001', 'image', 'rls/a.jpg', 'rls-fixture'),
  ('30000000-0000-4000-8000-000000000002', 'image', 'rls/b.jpg', 'rls-fixture');

insert into event_bookings (event_id, user_id, note)
values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'rls-fixture');

insert into documents (title, category, storage_path, file_name, mime_type, size_bytes, visibility) values
  ('rls-public-doc', 'policy', 'rls/pub.pdf', 'pub.pdf', 'application/pdf', 1000, 'public'),
  ('rls-members-doc', 'minutes', 'rls/mem.pdf', 'mem.pdf', 'application/pdf', 1000, 'members'),
  ('rls-committee-doc', 'other', 'rls/com.pdf', 'com.pdf', 'application/pdf', 1000, 'committee');

insert into pages (slug, title, visibility, status, published_at) values
  ('zz-rls-public', 'rls page pub', 'public', 'published', now()),
  ('zz-rls-members', 'rls page mem', 'members', 'published', now()),
  ('zz-rls-draft', 'rls page draft', 'public', 'draft', null);

insert into posts (slug, title, visibility, status, published_at) values
  ('rls-post-public', 'rls post pub', 'public', 'published', now()),
  ('rls-post-members', 'rls post mem', 'members', 'published', now()),
  ('rls-post-draft', 'rls post draft', 'public', 'draft', null);

insert into notices (title, body, visibility) values
  ('rls-members-notice', 'gate code 0000', 'members'),
  ('rls-committee-notice', 'committee only', 'committee');

insert into committee_roles (role_title, description) values ('rls-test-role', 'rls fixture');

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

create or replace function pg_temp.check_count(test text, uid uuid, q text, expected bigint)
returns void language plpgsql as $$
declare
  actual bigint;
begin
  perform pg_temp.impersonate(uid);
  begin
    execute q into actual;
  exception when others then
    actual := -1; -- permission denied etc.
  end;
  reset role;
  insert into results (test, expected, actual, pass)
  values (test, expected::text, actual::text, actual = expected);
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

-- ---------------------------------------------------------------- matrix
do $harness$
declare
  u_reg uuid := '10000000-0000-4000-8000-000000000001';
  u_mem uuid := '10000000-0000-4000-8000-000000000002';
  u_com uuid := '10000000-0000-4000-8000-000000000003';
  u_adm uuid := '10000000-0000-4000-8000-000000000004';
  fixture_profiles bigint;
begin
  select count(*) into fixture_profiles from profiles;

  -- profiles
  perform pg_temp.check_count('profiles: anon sees none', null, 'select count(*) from profiles', 0);
  perform pg_temp.check_count('profiles: registered sees own row only', u_reg, 'select count(*) from profiles', 1);
  perform pg_temp.check_count('profiles: member sees own row only', u_mem, 'select count(*) from profiles', 1);
  perform pg_temp.check_count('profiles: committee sees all', u_com, 'select count(*) from profiles', fixture_profiles);
  perform pg_temp.check_count('profiles: admin sees all', u_adm, 'select count(*) from profiles', fixture_profiles);
  perform pg_temp.check_denied('profiles: member cannot change own role', u_mem,
    format('update profiles set role = ''admin'' where user_id = %L', u_mem));

  -- current_members view (Decision 7)
  perform pg_temp.check_count('current_members: registered sees none', u_reg, 'select count(*) from current_members', 0);
  perform pg_temp.check_count('current_members: member sees other members'' names', u_mem, 'select count(*) from current_members', 2);
  perform pg_temp.check_count('current_members: committee sees all', u_com, 'select count(*) from current_members', 2);
  perform pg_temp.check_count('membership_history: member gets nothing', u_mem, 'select count(*) from membership_history', 0);
  perform pg_temp.check_count('membership_history: committee gets person x period grid', u_com,
    format('select count(*) from membership_history where user_id in (%L,%L)', u_reg, u_mem), 4);

  -- memberships
  perform pg_temp.check_count('memberships: registered sees none', u_reg, 'select count(*) from memberships', 0);
  perform pg_temp.check_count('memberships: member sees own only', u_mem, 'select count(*) from memberships', 1);
  perform pg_temp.check_count('memberships: committee sees all', u_com, 'select count(*) from memberships', 2);
  perform pg_temp.check_denied('memberships: member cannot self-record a payment', u_mem,
    format('insert into memberships (period_id, tier, status, primary_user_id, amount_pence, source) select id, ''adult'', ''active'', %L, 0, ''manual_cash'' from membership_periods where is_current', u_mem));

  -- membership_members
  perform pg_temp.check_count('membership_members: member sees own coverage', u_mem, 'select count(*) from membership_members', 1);
  perform pg_temp.check_count('membership_members: registered sees none', u_reg, 'select count(*) from membership_members', 0);

  -- events
  perform pg_temp.check_count('events: anon sees published public only', null, 'select count(*) from events where slug like ''rls-%''', 1);
  perform pg_temp.check_count('events: registered same as anon', u_reg, 'select count(*) from events where slug like ''rls-%''', 1);
  perform pg_temp.check_count('events: member also sees members visibility', u_mem, 'select count(*) from events where slug like ''rls-%''', 2);
  perform pg_temp.check_count('events: committee sees drafts too', u_com, 'select count(*) from events where slug like ''rls-%''', 3);
  perform pg_temp.check_denied('events: member cannot create events', u_mem,
    'insert into events (slug, title, starts_at) values (''rls-hack'', ''x'', now())');

  -- event_media
  perform pg_temp.check_count('event_media: anon sees public event media only', null, 'select count(*) from event_media where caption = ''rls-fixture''', 1);
  perform pg_temp.check_count('event_media: member sees members media too', u_mem, 'select count(*) from event_media where caption = ''rls-fixture''', 2);

  -- event_bookings
  perform pg_temp.check_count('bookings: member sees own booking', u_mem, 'select count(*) from event_bookings', 1);
  perform pg_temp.check_count('bookings: registered sees none', u_reg, 'select count(*) from event_bookings', 0);
  perform pg_temp.check_count('bookings: committee sees all', u_com, 'select count(*) from event_bookings', 1);
  perform pg_temp.check_denied('bookings: cannot book as somebody else', u_reg,
    format('insert into event_bookings (event_id, user_id) values (''30000000-0000-4000-8000-000000000001'', %L)', u_mem));

  -- documents
  perform pg_temp.check_count('documents: anon sees public only', null, 'select count(*) from documents where title like ''rls-%''', 1);
  perform pg_temp.check_count('documents: registered sees public only', u_reg, 'select count(*) from documents where title like ''rls-%''', 1);
  perform pg_temp.check_count('documents: member sees members docs', u_mem, 'select count(*) from documents where title like ''rls-%''', 2);
  perform pg_temp.check_count('documents: committee sees everything', u_com, 'select count(*) from documents where title like ''rls-%''', 3);

  -- pages / posts
  perform pg_temp.check_count('pages: anon sees published public', null, 'select count(*) from pages where slug like ''zz-rls-%''', 1);
  perform pg_temp.check_count('pages: member sees members pages', u_mem, 'select count(*) from pages where slug like ''zz-rls-%''', 2);
  perform pg_temp.check_count('pages: committee sees drafts', u_com, 'select count(*) from pages where slug like ''zz-rls-%''', 3);
  perform pg_temp.check_count('posts: anon sees published public', null, 'select count(*) from posts where slug like ''rls-%''', 1);
  perform pg_temp.check_count('posts: member sees members posts', u_mem, 'select count(*) from posts where slug like ''rls-%''', 2);

  -- committee_roles / notices
  perform pg_temp.check_count('committee_roles: anon can read', null, 'select count(*) from committee_roles where role_title = ''rls-test-role''', 1);
  perform pg_temp.check_count('notices: registered sees none', u_reg, 'select count(*) from notices where title like ''rls-%''', 0);
  perform pg_temp.check_count('notices: member sees members notices', u_mem, 'select count(*) from notices where title like ''rls-%''', 1);
  perform pg_temp.check_count('notices: committee sees both', u_com, 'select count(*) from notices where title like ''rls-%''', 2);

  -- segments / email
  perform pg_temp.check_count('segments: member sees none', u_mem, 'select count(*) from segments', 0);
  perform pg_temp.check_count('segments: committee sees system segments', u_com, 'select count(*) from segments where is_system', 8);
  perform pg_temp.check_denied('email: member cannot create campaigns', u_mem,
    'insert into email_campaigns (subject) values (''rls hack'')');

  -- audit
  perform pg_temp.impersonate(u_mem);
  perform audit('rls-test', 'harness');
  reset role;
  perform pg_temp.check_count('audit_log: committee cannot read', u_com, 'select count(*) from audit_log where action = ''rls-test''', 0);
  perform pg_temp.check_count('audit_log: admin reads, definer write landed', u_adm, 'select count(*) from audit_log where action = ''rls-test''', 1);

  -- import_batches
  perform pg_temp.check_denied('import_batches: committee cannot write', u_com,
    'insert into import_batches (source) values (''rls-fixture'')');

  -- role machinery
  perform pg_temp.check_denied('set_user_role: member call refused', u_mem,
    format('select set_user_role(%L, ''admin'')', u_mem));
  perform pg_temp.impersonate(u_adm);
  perform set_user_role(u_reg, 'committee');
  reset role;
  insert into results (test, expected, actual, pass)
  select 'set_user_role: admin call works', 'committee', role::text, role = 'committee'
  from profiles where user_id = u_reg;
  perform pg_temp.impersonate(u_adm);
  perform set_user_role(u_reg, 'registered');
  reset role;

  -- helpers
  insert into results (test, expected, actual, pass)
  values ('is_junior: 17-year-old is junior', 'true', is_junior((current_date - interval '17 years')::date)::text, is_junior((current_date - interval '17 years')::date)),
         ('is_junior: 19-year-old is not', 'false', is_junior((current_date - interval '19 years')::date)::text, not is_junior((current_date - interval '19 years')::date));

  -- storage policies present
  insert into results (test, expected, actual, pass)
  select 'storage.objects: 16 bucket policies', '16', count(*)::text, count(*) = 16
  from pg_policies where schemaname = 'storage' and tablename = 'objects';
end;
$harness$;

select case when pass then 'PASS' else 'FAIL' end as outcome, test, expected, actual
from results order by n;
