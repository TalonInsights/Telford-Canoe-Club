# Phase 4 plan — full membership system with a SIMULATED payment backend

Client order (3 Sep 2026): *"build the entire membership system so it fully works but
simulate the PayPal backend for testing purposes"*. This supersedes the earlier
"without current payment integration" carve-out: the integration is built to the
spec's shape, with a simulated provider standing in for PayPal until D1
(club PayPal account) is answered. Going live later is a settings flip + env
paste, not a rebuild.

## Design decisions

1. **Provider abstraction** — `lib/payments/provider.ts` exposes
   `getPaymentProvider()`; `simulated.ts` (active) and `paypal.ts` (complete
   Orders-v2 client per P4-01: cached OAuth token, create/capture,
   webhook signature verification — dormant until env vars exist).
   `PAYMENT_PROVIDER` env selects; default `simulated`.
2. **Order state rides on the membership row** — no new table. An online
   checkout stamps the existing pending row with `source='paypal'` +
   `paypal_order_id`; capture sets `paypal_capture_id` + `active`. Reuses the
   one-active constraint, RLS, the admin queue, and is exactly where real
   PayPal writes later (spec §5.2 columns).
3. **DB-enforced mode switch** — `club_settings.payment_provider`
   (`off | simulated | paypal`). `complete_online_payment()` (definer, exposed
   via PostgREST) activates on the caller's say-so **only when the setting is
   `simulated`** — in `paypal` mode it refuses and activation happens through
   the capture/webhook path with server-verified PayPal responses. This is the
   guard that makes the simulation safe to leave deployed: flipping the club
   to real payments instantly closes the self-capture door at the database,
   not just the UI.
4. **Simulated gateway page** — `/checkout/[orderRef]` under its own
   chrome-free route group, prominently labelled a test gateway ("no money
   moves"), with Approve / Decline (simulates a failed capture) / Cancel and
   return. Neutral styling; deliberately NOT PayPal branding.
5. **Renewals** — seed the 2027 period (not current). Renew is offered when a
   next period exists and the current membership has ended or ends within 60
   days (P4-05). `request_membership()` gains `p_period_id` (drop + recreate —
   an overload would be ambiguous through PostgREST).
6. **Crons (P4-08)** — `/api/cron/expiry-sweep` calls `run_expiry_sweep()`
   (marks date-expired rows, flips `is_current` when the calendar moves on —
   idempotent and time-determined, so safe regardless of caller) +
   `vercel.json` schedule. `/api/cron/renewal-reminders` ships env-gated
   (needs Resend + service key) with dry-run default.
7. **Emails (P4-04)** — `lib/email/membership.ts`, Resend-gated like the
   contact form; wired into online capture AND the admin record-payment path;
   silently skips without a key.
8. **Admin completion** — `/admin/settings` (P9-08, admin role: prices, year
   label, site status, bank note, payment provider, show-unconfirmed),
   `/admin/committee` (P9-09, roster editor), `/admin/members/new` (P9-07,
   grant a membership to an existing account; fully-offline people are covered
   by family names now and the invite flow at P11 — needs service key),
   extend + mark-refunded on the member record (P4-07 completion).

## Task list (commit per task)

- [ ] T1 plan file (this) — committed
- [ ] T2 `lib/payments/` provider abstraction + simulated + real PayPal client
- [ ] T3 migration `0018_payments.sql` + `supabase/tests/payments-harness.sql`
- [ ] T4 apply 0018 to the live DB (dashboard SQL API); regenerate
      `types/database.ts` (download bridge); run the payments harness live —
      all assertions green
- [ ] T5 checkout flow: welcome rework (Pay online / Pay treasurer),
      `startOnlineCheckoutAction`, gateway page + capture/decline/abandon
- [ ] T6 membership page states: resume-payment, pay-online-instead, renew,
      transaction refs, `?paid=1` success
- [ ] T7 webhook route (dormant) + crons + vercel.json schedule
- [ ] T8 activation emails wired (capture + admin record)
- [ ] T9 /admin/settings
- [ ] T10 /admin/committee
- [ ] T11 /admin/members/new + extend + mark-refunded
- [ ] T12 docs/payments.md + STATUS.md + dev/ui previews for the auth-gated
      clients; screenshots 375/1280; gates (`typecheck`, `lint`, `build`)

## Acceptance (phase exit, adapted from §Phase 4 exit)

End-to-end **on the live DB via the harness**: request → begin online →
capture (simulated) → membership active → `current_members` shows the user →
role promoted → audit trail complete; double-capture idempotent; foreign
capture refused; capture refused when provider ≠ simulated; abandon reverts
to the manual path; admin create/extend/refund audited; expiry sweep expires
a synthetic ended period and never touches the current one. App side: gates
green; every new UI state rendered and screenshotted.

## Out of scope (unchanged blocks)

Real PayPal credentials (D1), Resend key (D5), service-role key paste,
membership-year answer (D2 — 2027 period uses calendar year until answered).
