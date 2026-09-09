-- 0027 — editable content blocks.
--
-- Deliberately NOT a page builder. A fixed set of named slots on pages that
-- already exist, each one a list of typed blocks exactly like the minutes
-- body (0022), so the committee can rewrite the club's words without a deploy
-- and without being able to break a layout.
--
-- Each slot carries two versions: `body` is what the site shows, `draft_body`
-- is what the committee is working on. That is what makes "preview before
-- publish" real rather than a promise.
--
-- Drafts are committee-only, and that is enforced with column privileges
-- rather than by hoping nobody queries the API: the anon and authenticated
-- roles are granted the published columns only.

create table if not exists content_blocks (
  key text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  title text not null,
  -- Where it appears, in plain words, so the editing screen can say so.
  location text not null,
  help text,
  body jsonb not null default '[]'::jsonb,
  draft_body jsonb,
  published_at timestamptz,
  updated_by uuid references profiles (user_id),
  sort_order int not null default 0
);

drop trigger if exists content_blocks_updated_at on content_blocks;
create trigger content_blocks_updated_at
  before update on content_blocks
  for each row execute function set_updated_at();

alter table content_blocks enable row level security;

drop policy if exists content_blocks_read on content_blocks;
create policy content_blocks_read on content_blocks for select using (true);

drop policy if exists content_blocks_committee_all on content_blocks;
create policy content_blocks_committee_all on content_blocks
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

-- Column privileges: everyone may read the published copy, nobody outside the
-- committee may read a draft. RLS decides rows; this decides columns.
revoke select on content_blocks from anon, authenticated;
grant select (key, title, location, help, body, published_at, sort_order)
  on content_blocks to anon, authenticated;

/* ------------------------------------------------------------ the slots */

-- Seeded with the words already on the site, so the first edit is a change
-- rather than a blank page.
insert into content_blocks (key, title, location, help, body, sort_order, published_at)
values
  (
    'about.intro',
    'About the club, opening words',
    'The first section of the About page',
    'The two or three paragraphs that introduce the club to somebody who has never been.',
    '[
      {"type":"paragraph","text":"Telford Canoe Club is a forward-thinking paddlesports club based in Telford. We run on an ethos of encouraging paddlesports, whitewater kayaking and canoeing, freestyle, standup paddleboarding and more, to the widest possible range of participants. Our view is simple: there is nothing more mentally stimulating than time on the water in a natural environment, developing new skills and enjoying the outdoors."},
      {"type":"paragraph","text":"Whether you are aiming to push yourself on white water, throw the latest freestyle tricks, or just want a relaxing paddle along a river or lake, the club can cater to you. Run by experienced, qualified coaches and guides, we will take you safely from beginner onwards in an enthusiastic, safe and encouraging environment."}
    ]'::jsonb,
    1,
    now()
  ),
  (
    'river.guidance',
    'Reading the gauge',
    'The advice under the level bands on the river levels page',
    'How to think about the number. The bands themselves are edited on the river levels screen.',
    '[
      {"type":"paragraph","text":"The nearest Environment Agency gauge is at Buildwas, a few miles upstream of Jackfield, and what passes the gauge reaches the rapid shortly after. Low water exposes the rocks and slows the wave down; more flow builds the features and pushes harder. The Severn responds slowly to rain, so a wet day rarely changes the level instantly, but upstream reservoir releases like the Clywedog can add a useful top-up."},
      {"type":"paragraph","text":"Bands are guidance from the committee, not a promise. If you are unsure whether it is a good level for your ability, ask on a club night before committing, and remember the site is used by competent paddlers at their own risk."}
    ]'::jsonb,
    2,
    now()
  ),
  (
    'home.notice',
    'Message on the home page',
    'A band under the hero on the home page',
    'Leave this empty and nothing appears. Use it for something the whole club needs to see, like a working party or a closure.',
    '[]'::jsonb,
    3,
    null
  )
on conflict (key) do nothing;
