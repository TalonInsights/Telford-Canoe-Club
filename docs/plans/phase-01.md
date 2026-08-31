# Phase 1 migration plan — schema, RLS, seed

Cloud project: `tcc-website` (`ruxtoklrnijuijfupfvj`, AWS eu-west-2/London) on the
user's Supabase org, created 31 Aug 2026 — the P0-26 blocker is closed
("live on my supabase for now so we can test"). Migrations are applied through
the dashboard's SQL endpoint in the user's authenticated browser session, so no
database password or service key ever passes through tooling; the repo's
migration files remain the source of truth and replay cleanly via
`supabase db push` once the CLI is linked.

## Decisions carried in from validation (STATUS.md "Decisions taken")
- `is_junior` is a **function + view column**, never a stored generated column.
- `membership_members` gets its own `id` PK; the person-per-membership rule is a
  **unique expression index** `(membership_id, coalesce(user_id::text, lower(display_name)))`.
- §5.4's "members see other members' names" is delivered by making
  `current_members` a **security-definer view** that itself gates on
  `is_current_member(auth.uid()) OR has_role(auth.uid(), 'committee')` —
  profiles RLS stays own-row-only. Logged as Decision 7.
- Helper functions are created **before** the tables (PL/pgSQL bodies are not
  validated against missing tables at create time) so every table can enable
  RLS with its real policies in its own migration — §0 rule 10.

## File order (supabase/migrations/)
1. `0001_enums.sql` — §5.1 exactly.
2. `0002_helpers.sql` — `set_updated_at()`, `has_role()`, `is_current_member()`, `is_junior(date)`.
3. `0003_profiles.sql` — table + signup trigger + role-change guard + RLS.
4. `0004_membership_periods.sql` — + partial unique `is_current`, seed 2025 (past) + 2026 (current).
5. `0005_memberships.sql` — + one-active-per-person-per-period partial unique, RLS.
6. `0006_membership_members.sql` — + expression unique, RLS.
7. `0007_views_roles.sql` — `current_members`, `membership_history`, `set_user_role()`.
8. `0008_events.sql` — events, event_bookings, event_media + RLS.
9. `0009_documents.sql` — + RLS.
10. `0010_pages_posts.sql` — + reserved-slug guard constraint + RLS.
11. `0011_committee_notices.sql` — + RLS.
12. `0012_segments.sql` — + system segment seed.
13. `0013_email.sql` — campaigns + recipients + RLS.
14. `0014_audit.sql` — audit_log + `audit()` security-definer writer.
15. `0015_import_batches.sql`.
16. `0016_storage.sql` — four buckets + storage.objects policies.

Then: P1-17 `supabase/tests/rls-harness.sql` (JWT-claim impersonation for all
four roles across every §5.4 cell, runs in one transaction and reports
PASS/FAIL rows) + `scripts/test-rls.ts` runner for CI once env keys exist;
P1-18 `supabase/seed.sql` (committee roles with Chair placeholder, 3 events,
2 posts) — placeholder image upload into `site-images` follows once the local
anon key is pasted (user-held credential), tracked on the task line.

Types: fetched from the platform types endpoint into `types/database.ts`.
Commit per task `P1-NN: …`; push at phase end.
