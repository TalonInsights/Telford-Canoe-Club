-- P1-18 — browsable starter dataset. Committee roles per P1-18 (holders
-- vacant except Chair = Simon Wiles placeholder name, §1 client contact);
-- three sample events in the club's real categories (§10.1); the two 2026
-- news posts named in §10.1 as excerpts (full copy migrates in Phase 2).
-- Idempotent: keyed deletes first. Placeholder image files upload to the
-- site-images bucket once local storage credentials exist; the paths used
-- here already follow the §9 naming.

delete from committee_roles;
delete from events where slug in ('club-evening-paddle','pool-session','freestyle-session');
delete from posts where slug in ('paddle-uk-club-membership','tcc-committee');

-- The real 2026 committee (from April), per the club's committee page.
insert into committee_roles (role_title, holder_display_name, sort_order, description) values
  ('Chairman', 'Simon Wiles', 1, 'Leads the committee and represents the club.'),
  ('Treasurer', 'Josh Smyth', 2, 'Club finances and membership payments.'),
  ('Secretary', 'Bek Farley-Brown', 3, 'Minutes, correspondence and club records.'),
  ('Membership secretary', 'Susanna Smyth', 4, 'The member register, renewals and Paddle UK affiliation.'),
  ('Committee member', 'David Allen', 5, 'General committee duties and site management.'),
  ('Freestyle champion', 'Simon Wyndham', 6, 'Freestyle coaching, workshops and the club''s freestyle programme.');

insert into events (slug, title, summary, category, location_name, location_address,
                    starts_at, ends_at, visibility, status, water_level_dependent,
                    booking_enabled, cover_image_path)
values
  ('club-evening-paddle',
   'Club evening paddle',
   'Our regular summer evening session at Jackfield Rapids — water levels dependent, all welcome from improver upwards.',
   'club_night', 'Jackfield Rapids', 'The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ',
   date_trunc('day', now()) + interval '4 days' + interval '17 hours 30 minutes',
   date_trunc('day', now()) + interval '4 days' + interval '21 hours',
   'public', 'published', true, false, 'placeholders/hero-jackfield.jpg'),
  ('pool-session',
   'Pool session',
   'Indoor skills session — rolling practice and boat handling in warm water.',
   'pool', 'Local pool', null,
   date_trunc('day', now()) + interval '11 days' + interval '19 hours',
   date_trunc('day', now()) + interval '11 days' + interval '20 hours',
   'public', 'published', false, true, null),
  ('freestyle-session',
   'Freestyle session',
   'Playboating on the wave when levels allow — coaching support for new freestyle paddlers.',
   'freestyle', 'Jackfield Rapids', 'The Lloyds, Jackfield, Ironbridge, Telford TF8 7HJ',
   date_trunc('day', now()) + interval '13 days' + interval '10 hours',
   date_trunc('day', now()) + interval '13 days' + interval '13 hours',
   'public', 'published', true, false, 'placeholders/fs-hpp-air.jpg');

insert into posts (slug, title, excerpt, category, cover_image_path, visibility, status, published_at, body)
values
  ('paddle-uk-club-membership',
   'Paddle UK club membership',
   'A request from Simon Wiles for members to update their JustGo profiles so the club''s Paddle UK affiliation records stay accurate.',
   'Club news', null, 'public', 'published', '2026-05-23T09:00:00Z',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Full post copy migrates from the current site in Phase 2 (spec §10.1)."}]}]}'::jsonb),
  ('tcc-committee',
   'TCC committee',
   'On committee viability, the roles that need filling, and thanks to Iain for his years of service.',
   'Club news', null, 'public', 'published', '2026-04-18T09:00:00Z',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Full post copy migrates from the current site in Phase 2 (spec §10.1)."}]}]}'::jsonb);
