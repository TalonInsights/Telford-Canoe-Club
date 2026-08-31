-- P1-10 — committee CMS pages and news posts.
create table pages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique,
  title text not null,
  body jsonb,
  excerpt text,
  hero_image_path text,
  visibility visibility not null default 'public',
  status text not null default 'draft' check (status in ('draft', 'published')),
  show_in_nav boolean not null default false,
  nav_parent text,
  nav_order int not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  author_user_id uuid references profiles (user_id),
  -- §5.2: reserved slugs — every fixed route in §4 can never be shadowed by
  -- a CMS page. Kept in one place; the P7-03 editor reads the same list.
  constraint pages_slug_not_reserved check (
    slug !~ '^(paddlesports|about|venue|events|news|join|contact|login|register|forgot-password|reset-password|verify|welcome|members|admin|api|dev|_next)(/.*)?$'
  )
);

create trigger pages_updated_at
  before update on pages
  for each row execute function set_updated_at();

alter table pages enable row level security;

create policy pages_public_read on pages
  for select using (status = 'published' and visibility = 'public');

create policy pages_members_read on pages
  for select using (
    status = 'published' and visibility = 'members' and is_current_member(auth.uid())
  );

create policy pages_committee_all on pages
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create table posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  slug text not null unique,
  title text not null,
  body jsonb,
  excerpt text,
  category text,
  cover_image_path text,
  visibility visibility not null default 'public',
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  author_user_id uuid references profiles (user_id)
);

create index posts_published on posts (status, published_at desc);

create trigger posts_updated_at
  before update on posts
  for each row execute function set_updated_at();

alter table posts enable row level security;

create policy posts_public_read on posts
  for select using (status = 'published' and visibility = 'public');

create policy posts_members_read on posts
  for select using (
    status = 'published' and visibility = 'members' and is_current_member(auth.uid())
  );

create policy posts_committee_all on posts
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));
