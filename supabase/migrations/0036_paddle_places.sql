-- "Where we paddle" becomes managed content (Simon 4). The paddlesports page
-- had a fixed paragraph; now the committee keeps a list of places the club
-- paddles, each with a name, a category, a description, an optional photo and
-- one or more links, and can add, edit, remove and reorder them.
--
-- Category groups the list into the two kinds a paddler thinks in: built
-- courses and natural rivers. Links are a small JSON array of {label, url};
-- the photo lives in the public site-images bucket like event covers and
-- committee photos.
create table paddle_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('artificial', 'natural')),
  description text not null default '',
  photo_path text,
  links jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger paddle_places_updated_at
  before update on paddle_places
  for each row execute function set_updated_at();

alter table paddle_places enable row level security;

create policy paddle_places_public_read on paddle_places
  for select using (is_published or has_role(auth.uid(), 'committee'));

create policy paddle_places_committee_write on paddle_places
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

grant select on paddle_places to anon, authenticated;
grant insert, update, delete on paddle_places to authenticated;

insert into paddle_places (name, category, description, links, sort_order) values
  ('Holme Pierrepont, Nottingham',
   'artificial',
   'The National Water Sports Centre: a long artificial course that runs on release days, good for building moving-water skills close to home.',
   '[{"label":"Centre website","url":"https://nwscnotts.com"}]'::jsonb, 1),
  ('Lee Valley White Water Centre',
   'artificial',
   'The 2012 Olympic course near London, with an Olympic and an intermediate loop, bookable through the year.',
   '[{"label":"Centre website","url":"https://www.gopaddling.info"}]'::jsonb, 2),
  ('National White Water Centre, Tryweryn',
   'artificial',
   'A dam-fed natural-feeling course in Snowdonia that runs most of the year whatever the weather, a regular club trip.',
   '[{"label":"Centre website","url":"https://www.nationalwhitewatercentre.co.uk"}]'::jsonb, 3),
  ('Cardiff International White Water',
   'artificial',
   'A modern pumped course in Cardiff Bay, reliable water and a warm welcome for a weekend away.',
   '[{"label":"Centre website","url":"https://ciww.com"}]'::jsonb, 4),
  ('The River Dee, Llangollen',
   'natural',
   'A classic North Wales whitewater run that comes alive after rain, a favourite club trip in the autumn and winter season.',
   '[]'::jsonb, 5);
