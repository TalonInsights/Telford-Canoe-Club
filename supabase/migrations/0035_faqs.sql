-- FAQ, committee-managed (Simon 7). Shown on the contact page; the committee
-- adds, edits, removes and reorders the entries, Simon writes the words.
--
-- A plain question and answer, not the typed-block model used for minutes and
-- emails: an FAQ answer is a short paragraph or two, and a textarea is the
-- least friction for whoever is typing it. Line breaks are preserved on
-- display, nothing is interpreted as markup.
create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger faqs_updated_at
  before update on faqs
  for each row execute function set_updated_at();

alter table faqs enable row level security;

-- Anyone may read a published FAQ; the committee reads drafts too and manages
-- every row.
create policy faqs_public_read on faqs
  for select using (is_published or has_role(auth.uid(), 'committee'));

create policy faqs_committee_write on faqs
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

grant select on faqs to anon, authenticated;
grant insert, update, delete on faqs to authenticated;

insert into faqs (question, answer, sort_order) values
  ('Can I come for one session before joining?',
   'Get in touch first and we will tell you about guest or taster options for the discipline you are interested in. Club sessions run for members, but we are happy to talk through how to try the club.',
   1),
  ('How do I join?',
   'Use the Join page on this site to set up an account and pay, or come along to a session and talk to a committee member. Membership runs for the year and covers club sessions, club boats and kit, and the members'' area of the site.',
   2),
  ('Do I need my own boat and kit?',
   'Not to begin with. The club has boats, paddles and buoyancy aids you can borrow at club sessions while you find your feet.',
   3);
