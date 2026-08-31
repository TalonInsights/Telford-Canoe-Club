-- P1-13 — campaigns and per-recipient delivery state.
create table email_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  subject text not null,
  preheader text,
  body jsonb,
  segment_id uuid references segments (id),
  segment_snapshot jsonb,
  status campaign_status not null default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_by uuid references profiles (user_id),
  recipient_count int,
  resend_batch_ids text[]
);

create trigger email_campaigns_updated_at
  before update on email_campaigns
  for each row execute function set_updated_at();

alter table email_campaigns enable row level security;

create policy campaigns_committee_all on email_campaigns
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));

create table email_recipients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  campaign_id uuid not null references email_campaigns (id) on delete cascade,
  user_id uuid references profiles (user_id),
  email text not null,
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','bounced','complained','failed')),
  resend_id text,
  error text
);

create index email_recipients_campaign on email_recipients (campaign_id, status);

alter table email_recipients enable row level security;

create policy recipients_committee_all on email_recipients
  for all using (has_role(auth.uid(), 'committee'))
  with check (has_role(auth.uid(), 'committee'));
