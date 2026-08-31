-- P1-14 — append-only audit log, written only through audit().
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip text
);

create index audit_log_entity on audit_log (entity, entity_id);
create index audit_log_actor on audit_log (actor_user_id, created_at desc);

alter table audit_log enable row level security;

-- §5.4: admin R only. No insert policy for any role — writes go through the
-- definer function below; app code never deletes (no delete policy at all).
create policy audit_admin_read on audit_log
  for select using (has_role(auth.uid(), 'admin'));

create or replace function audit(
  p_action text,
  p_entity text,
  p_entity_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_ip text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (actor_user_id, action, entity, entity_id, before, after, ip)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_before, p_after, p_ip);
end;
$$;
