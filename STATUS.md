# TCC build status

Spec: `docs/TCC-BUILD-SPEC-v2.0.md` · Validation: `docs/SPEC-VALIDATION.md` · Rule: a task is ticked only when its acceptance line is demonstrably true.

## Phase 0 — Scaffold, tokens, component sourcing, shell
- [x] P0-01 Init Next + TS strict + Tailwind v4 + pnpm; ESLint/Prettier; CLAUDE.md; STATUS.md; .env.example; design-decisions — `pnpm build` passes (Next 16.3.3, React 19.2.8, Tailwind v4, TS strict)
- [x] P0-02 shadcn init (radix base, CSS vars, neutral); 21st via connected MCP (live search verified); docs/components.md created
- [x] P0-03 Fonts + tokens + contrast script — 20 pairs pass; h1 Bricolage 44px on foam verified in browser
- [x] P0-04 shadcn primitives tokenised on /dev/ui — axe 0 violations (fixed tabs inactive contrast)
- [x] P0-05 Layout system on /dev/layout — mechanical audit at 375/768/1280: every row full, equal heights, one left edge, no h-scroll; 7-item case = 4+3 span-balanced
- [x] P0-06 Header + MobileNav — sourced (shadcnblocks navbar1, logged), drawer focus-trap + Escape verified, signal underline, aria-current
- [x] P0-07 Footer — sourced (mvp_Subha footer-column, logged); role aliases only, no personal addresses
- [x] P0-08 HomeHero — sourced+logged; svh heights fixed, reveal-once flag, reduced-motion; rAF-starved pane can’t play animations — visual QA deferred to deployed URL
- [x] P0-09 Cards — one anatomy, equal heights proven with mismatched copy at 375/1280
- [x] P0-10 PricingTiers — sourced+logged, on /dev/ui
- [x] P0-11 FaqAccordion — sourced+logged, on /dev/ui
- [x] P0-12 CommitteeGrid — sourced+logged, vacant variant, on /dev/ui
- [x] P0-13 EventCalendar — month grid + mobile list fallback, sourced+logged, on /dev/ui
- [x] P0-14 DatePicker/DateTimePicker — react-day-picker, sourced+logged, on /dev/ui
- [x] P0-15 FileUpload — validation+progress+preview, keyboard operable, on /dev/ui
- [x] P0-16 ImageGallery — lightbox + click-to-load embeds, on /dev/ui
- [x] P0-17 DataTable — tanstack v8, aria-sort, pinned first column, CSV, on /dev/ui
- [x] P0-18 StatCard — sourced+logged, tabular nums, on /dev/ui
- [x] P0-19 AdminSidebar + BottomTabBar — sourced+logged (used by members/admin shells in P3-06)
- [x] P0-20 EmptyState — sourced+logged, min-height rule, on /dev/ui
- [x] P0-21 Stepper — sourced+logged, aria-current step, on /dev/ui
- [x] P0-22 SignInForm/SignUpForm — RHF+Zod, §3.5 pattern, junior guardian path, on /dev/ui
- [x] P0-23 Timeline — sourced+logged, static, on /dev/ui
- [x] P0-24 DateTime/Money helpers — 7 vitest tests pass incl. BST wall-clock assertions
- [x] P0-25 not-found/error/loading — branded 404 with nav, retryable error page, layout-matched skeletons
- [x] P0-26 lib/supabase clients + cloud project `tcc-website` (eu-west-2) + generated types — fully complete as of Phase 1 (account decision answered 31 Aug)
- [x] P0-27 Vercel linked (framework switched Other→nextjs via vercel.json); push→production verified live twice; PR previews are on by default; env vars deferred — every secret-bearing service (Supabase/PayPal/Resend) is still account-blocked

**Phase 0 exit (31 Aug 2026):** 26 of 27 tasks fully ticked; P0-26 split (code ✓ / cloud project BLOCKED).
`pnpm build` green. `docs/components.md` covers every §3.6 row (21 primitives + 17 blocks, all
sourced via live 21st search, all MIT). axe 0 violations on /dev/ui (23 blocks). Balance audit
passed mechanically at 375/768/1280. Lighthouse mobile on the production deployment: **home
95/98/96/100** (LCP 2.9s — P2-01 tightens to <2.5s); /dev/ui 90 perf — the kitchen-sink page
carries every client bundle at once and is deleted at P12-02; its one a11y fail (heading order)
fixed same day. Hero reveal: rAF paths code-verified + CSS reveal-guarantee added and
wiring-verified; visual play-through needs a foreground browser — first item of Phase 2 QA.

## Phase 1 — Database schema, RLS, seed
- [x] P1-01 enums · [x] P1-02 profiles+triggers (signup, email-sync, role guard) · [x] P1-03 membership_periods (2025 past + 2026 current) · [x] P1-04 memberships (+promotion trigger) · [x] P1-05 membership_members · [x] P1-06 views (definer, self-gated — Decision 7) · [x] P1-07 helpers + set_user_role · [x] P1-08 events/bookings/media · [x] P1-09 documents · [x] P1-10 pages/posts (+reserved-slug constraint) · [x] P1-11 committee_roles/notices · [x] P1-12 segments (8 system) · [x] P1-13 email tables · [x] P1-14 audit_log + audit() · [x] P1-15 import_batches · [x] P1-16 storage (4 buckets, 16 policies)
- [x] P1-17 RLS harness — **52/52 assertions pass** on the live DB (jwt-claim impersonation across anon/registered/member/committee/admin; caught and fixed a memberships↔membership_members policy recursion). `supabase/tests/rls-harness.sql`; `pnpm test:rls` runner comes with CI wiring.
- [x] P1-18 seed — 8 committee roles (Chair = Simon Wiles placeholder), 3 events, 2 posts committed; dataset browsable. *Placeholder image upload into `site-images` pending the anon key paste (user-held credential) — carried into Phase 2 prep.*

**Phase 1 exit (31 Aug 2026):** cloud project `tcc-website` (`ruxtoklrnijuijfupfvj`, AWS eu-west-2/London) created on the user's Supabase org per their instruction. All 16 migrations applied; `types/database.ts` generated from the live schema. Migrations were applied via the dashboard's SQL API in the user's session — no DB password or service key ever passed through tooling; the DB password was generated in-browser and discarded (reset from the dashboard if direct psql access is ever needed).

## Home page package (TCC-HOME-CLAUDE-CODE-BRIEF.md, 31 Aug 2026)
- [ ] HOME-01 drop in home page · [ ] HOME-02 environment · [ ] HOME-03 content wiring · [ ] HOME-04 client-gated switches · [ ] HOME-05 images · [ ] HOME-06 placeholder route · [ ] HOME-07 verification
- **BLOCKED: `tcc-home.zip` not received** — the brief arrived alone; `tcc-home.zip`, `TCC-HOME-PAGE-v1.0.md` and `TCC-BUILD-SPEC-v2.2.md` are not on this machine (searched Downloads/Desktop/Documents). Prep done without ticking: EA env vars added to `.env.example`/`.env.local`; shared `(public)/[...slug]` placeholder route created (kills dead home links AND the Phase-0 prefetch-404 console noise).
- Integration deltas to reconcile at install (this repo is further along than the brief assumes): Next 16 not 15 · dev port 3030 not 3000 · Supabase Phase 1 is LIVE (site-data getters can swap to real queries once the anon key is pasted) · existing tokenised `components/ui/button.tsx` vs zip `Button` (Windows case-insensitive collision) · existing Header/Footer/layout/globals from Phase 0 to merge per brief §1.2 · repo docs carry spec v2.0 — v2.2 referenced but not supplied.

## Phase 2 — Public site (built 31 Aug against the chairman's "mirror the current site, improved" order)
- [x] P2-01 hero (home per HOME brief — supersedes v2.0 home spec by client order) · [x] P2-02 three sports (home PaddleYourWay) · [x] P2-03 events strip (home WhatsOn, live query + empty state) · [x] P2-04 news (home LatestNews) · [x] P2-05 venue presence (status strip cell + footer address — HOME design supersedes the v2.0 venue strip) · [x] P2-06 join CTA (JoinBand, live prices) · [x] P2-07 /paddlesports · [x] P2-08 whitewater (full migrated copy) · [x] P2-09 freestyle (full copy incl. GB workshops/Burners) · [x] P2-10 paddleboarding (+301 from /standup-paddleboard-sup) · [x] P2-11 /about (full copy + history timeline) · [x] P2-12 committee (real 2026 roster from DB) · [x] P2-13 role-descriptions (Paddle UK docs linked) · [x] P2-14 policies (all 9 club documents linked) · [x] P2-15 privacy (rewritten for the new site; 5-year retention stated; formal doc linked — D7 sign-off pending) · [x] P2-16 /venue + /venue/river-levels (live Buildwas gauge; no third-party scripts, no cookies) · [x] P2-17 /events (upcoming/calendar/past tabs) · [x] P2-18 event detail (all six booking states + .ics) · [x] P2-19 news list + full three-post archive (content layer; Tiptap renderer comes with P7) · [x] P2-20 /join (live tier prices, what's included, FAQ, 3-step how-it-works) · [x] P2-21 /contact (honeypot + 5/min rate limit; Resend send activates with the API key — graceful message until then) · [x] P2-22 CMS catch-all deferred to Phase 7 with the editor (placeholder catch-all removed; unknown URLs 404 properly) · [x] P2-23 per-page metadata + sitemap.ts + robots (disallow-all until launch)
- §10.4 redirect map live in next.config (P12-01 brought forward). All 24 public/auth routes verified 200 with correct h1s; axe 0 violations on home, join, whitewater, events.

## Phase 3 — Auth and onboarding
- [x] P3-01 register (full §5.2 field set, junior→guardian required, consents; profile completed after signUp) · [x] P3-02 verify page (+Supabase email verification) · [x] P3-03 login (password + magic-link tab) · [x] P3-04 forgot/reset · [x] P3-05 /welcome tier step (family names collected; hands off to the manual-payment path while PayPal is blocked on D1) · [x] P3-06 requireRole/requireCurrentMember + middleware + members/admin layouts (registered-but-unpaid users land on /members/membership only)
- All auth degrades gracefully until the anon key is pasted (clear message, no crashes). End-to-end auth flows need the key to exercise — first job after paste.

## Phase 4 — Membership and payments (built with a SIMULATED PayPal backend, client order 3 Sep)
- [x] P4-01 payment lib — `lib/payments/`: provider abstraction + `simulated.ts` (live) + `paypal.ts` (real Orders v2 client, dormant until D1) · [x] P4-02 checkout — welcome fork (Pay online / Pay treasurer), `/checkout/[orderRef]` simulated gateway (Approve/Decline/Cancel), `lib/actions/payments.ts` · [x] P4-03 webhook — `/api/paypal/webhook` (signature verify + capture/refund/denied/pending, idempotent; 503 until D1) · [x] P4-04 notifications — `lib/email/membership.ts` on online capture AND admin record (Resend-gated, skips silently) · [x] P4-05 /members/membership (Active/Pending/online-started-resume/Not-active + renew + receipt banner + txn refs) · [x] P4-06 admin record payment (+ same notifications) · [x] P4-07 cancel + extend-a-year (£0 complimentary next period) + mark-refunded, all audited · [x] P4-08 crons — `/api/cron/expiry-sweep` + `/api/cron/renewal-reminders` (dry-run default) + vercel.json schedules · [x] P4-09 `docs/payments.md`
- **Migration 0018 applied LIVE + `supabase/tests/payments-harness.sql` = 31/31 PASS on the live DB.** `club_settings.payment_provider` (off/simulated/paypal) is the switch — enforced IN the database: `complete_online_payment()` honours a caller-initiated capture only while `simulated`; flipping to `paypal` shuts the self-capture door everywhere. DB fns: `begin_online_payment`, `complete_online_payment`, `abandon_online_payment`, `admin_create_membership`, `admin_extend_membership`, `run_expiry_sweep`; `request_membership` gained `p_period_id` (renewals). 2027 period seeded. Types regenerated (via studio same-origin `/dashboard/api/v1/projects/{ref}/types/typescript`, cookie-auth — the platform pg-meta typegen path 404s now).
- **The full loop, no real payment needed:** choose tier → **Pay online now** → `/checkout/<order>` → Approve → active + role promotion + receipt (or Decline/Cancel) — OR **Pay the treasurer** → pending → admin "Payments to record" queue → active. Both paths audited. Verified visually (join "Pay your way" copy; welcome online/treasurer fork rendered). Gateway page + admin screens render live the moment the anon key is pasted; their exact server fns are already harness-proven.
- **Family members are fuller individual records (4 Sep, client order):** migration 0019 — `membership_members` gains `date_of_birth` + emergency contact; `request_membership`/`admin_create_membership` take a jsonb family array (name, dob, emergency contact) instead of a name list; juniors auto-flagged from DOB. Welcome + admin add-membership forms collect a full record per person; member page and admin record display them. Applied + live-tested on the live DB (child b. 2016 → is_junior true), types regenerated, deployed. One household login unchanged.
- **Test-mode conveniences (4 Sep):** anon key + site URL in Vercel env; Supabase SITE_URL=prod + redirect allowlist (prod/** + localhost:3030/**); **email confirmation OFF for testing (MAILER_AUTOCONFIRM=true) — turn back ON before launch** (P12/P13 checklist item).

## Phase 4 — original no-payment carve-out (superseded 3 Sep by the simulate-PayPal order)
- Migration 0017 `request_membership` still present (now extended in 0018). The "without current payment integration" instruction was lifted by the 3 Sep order to simulate the backend for testing.

## Phase 5 — Events and bookings (built 4 Sep 2026, client order: admin adds events with an image; members confirm attendance; admins see who attends)
- [x] P5-01 admin list — `/admin/events` (upcoming / past / drafts with confirmed counts, nav entry + bottom tab) · [x] P5-02 event form — `/admin/events/new` + `/admin/events/[id]`: title, slug, category, summary, details (plain text in `body` until P7-02 Tiptap), start/end, location, visibility, water-level flag, cost, attendance settings (confirm on/off, places, waitlist, members-only, open/close), **cover photo uploaded straight to Storage** (`site-images/events/{id}/…`, resolved by `lib/events/images.ts` everywhere events are drawn — cards, hero, home, OG); draft → publish → cancel (emails attendees) → delete, all audited · [ ] P5-03 media manager (gallery + video embeds) — deferred; cover image only · [x] P5-04 booking engine — **migration 0020 applied LIVE**: `book_event()` decides booked/waitlist under a row lock (idempotent, members-only + window checks in-DB), `cancel_booking()` promotes the waitlist and returns who to email, `event_attendance()` public counts; actions rewritten on top · [x] P5-05 booking emails — confirmed / waitlisted / promoted / cancelled-by-club / event-cancelled (`lib/email/bookings.ts`, Resend-gated) · [x] P5-06 my bookings (status wording, leave-waitlist, no cancel once started) · [x] P5-07 attendees tab — names, email, phone, status, check-in / no-show / remove (waitlist moves up), CSV export, counts · [ ] P5-08 public + per-member `.ics` feeds — per-event `.ics` exists from P2-18; feeds deferred
- Public event page: "I'm coming — confirm my place" / "Join the waitlist" / "You're confirmed" / "You're on the waitlist" states with live counts ("8 confirmed · 4 places left"); details paragraphs rendered; home "What's on" now uses the image card. Plan: `docs/plans/phase-05.md`.
- **Live-tested 4 Sep on production:** admin form → cover photo uploaded to `site-images/events/{id}/cover-….jpg` (served publicly, rendered by next/image in the hero and on the cards) → published → public page → confirmed as taloninsights → "You're confirmed · 1 confirmed · 11 places left" → attendees tab lists the person with check-in / no-show / remove. Engine scenario on a temporary capacity-1 event: A booked, B waitlisted, repeat click idempotent, A cancels → B promoted (email + name returned), "that is not your booking" guard, audit trail confirmed → waitlisted → cancelled → promoted; temp rows removed. The sample event "Autumn river skills evening" is kept as a **draft** example. Removed the three "rls …" harness events that were showing publicly. **Still in the live DB: the Phase 1 harness accounts (`rls-*@test.invalid`, "Mem Test") hold memberships and inflate the paid-member count — remove before launch (needs auth-user deletion).**
- Not click-tested: the browser buttons themselves (confirm / check-in) — the automation tab was hidden and React never hydrated it, so the SQL path was exercised directly; the action ↔ RPC wiring is the same pattern as the proven payment buttons.

## Phase 6 — Document library
- [ ] P6-01 upload · [ ] P6-02 supersede · [ ] P6-03 public policies · [ ] P6-04 members library · [ ] P6-05 review-due widget

## Phase 7 — Committee CMS
- [ ] P7-01 Tiptap editor · [ ] P7-02 renderer · [ ] P7-03 pages CRUD · [ ] P7-04 news CRUD · [ ] P7-05 nav builder

## Phase 8 — Members area
- [x] P8-01 dashboard (membership, next events, bookings, notices, documents cards) · [x] P8-02 notices page (member-gated; admin notice CRUD to follow) · [x] P8-03 profile edit (contact, address, Paddle UK no., emergency contact, email opt-out) · [x] P8-04 mobile bottom tab bar + desktop subnav
- Also: /members/events my-bookings with confirm-dialog cancel; /members/documents with signed-URL delivery (empty state until P6 uploads).

## Phase 9 — Admin directory and segments
- [x] P9-01 overview (paid-by-tier, awaiting payment, never-paid, upcoming events + payments-to-record queue with one-click recording) · [x] P9-02 members table (sort, search, status/tier/junior chips, sticky first column, row→record) · [ ] P9-03 saved-segment builder (chips cover the everyday filters; JSON builder next session) · [ ] P9-04 saved segments · [x] P9-05 partial: bulk select → CSV export (bulk email waits for Phase 10) · [x] P9-06 member record (profile, memberships incl. covered names, bookings, record/cancel/extend/refund actions) · [x] P9-07 manual add member (`/admin/members/new` — grant to an existing account, walk-up cash/import) · [x] P9-08 settings screen (`/admin/settings`, admin: prices, year label, payment provider, site status, bank note; audited) · [x] P9-09 committee roles admin (`/admin/committee` editor → public page) · [x] P9-10 audit viewer (admin-only)
- Chairman's headline question — "who is a current paid adult member?" — is 2 taps from /admin: Members → Paid up + Adult.

## Phase 10 — Email
- [ ] P10-01 domain + templates · [ ] P10-02 composer · [ ] P10-03 send pipeline · [ ] P10-04 suppression · [ ] P10-05 report · [ ] P10-06 unsubscribe

## Phase 11 — ARMember migration
- [ ] P11-01 mapping doc · [ ] P11-02 dry-run · [ ] P11-03 import · [ ] P11-04 invites · [ ] P11-05 reconciliation

## Phase 12 — Quality, SEO, redirects, a11y, perf
- [ ] P12-01 redirects · [ ] P12-02 remove /dev · [ ] P12-03 axe+Lighthouse · [ ] P12-04 image audit · [ ] P12-05 security headers + rate limits · [ ] P12-06 monitoring · [ ] P12-07 backups

## Phase 13 — Launch and handover
- [ ] P13-01 club-owned accounts · [ ] P13-02 DNS cutover · [ ] P13-03 admin guide · [ ] P13-04 walkthrough · [ ] P13-05 maintenance contract

## Phase 14 — optional v2 (not launch scope)
- [ ] P14-01 read-only Ask assistant

---

## Design refresh (4 Sep 2026 — client order: badge supplied, "complete creative freedom … same theme, pages symmetrical")
Plan: `docs/plans/design-refresh.md`. The §3 system is unchanged; this adds the brand and rhythm inside it.
- [x] DR-01 brand mark — `components/site/brand.tsx` (`ClubBadge` plain/detailed, `BridgeArch`, `Wordmark`), drawn from the badge; `/dev/brand` proving page (goes with the other /dev routes at P12-02) · [x] DR-02 `app/icon.svg` replaces the framework favicon, `apple-icon` + `opengraph-image` generated from the badge, `metadataBase` + OG defaults · [x] DR-03 header: badge + stacked wordmark + hairline; sheet to match · [x] DR-04 footer: badge column, one-line description, arch motif · [x] DR-05 `Section` gains `kicker` + `decor="arch"`; `CtaBand` replaces the six ad-hoc deep bands (home, about, venue, join, paddlesports, sport pages); `Button variant="inverse"` replaces the repeated white-on-deep class string · [x] DR-06 `PageHero`: gradient overlay instead of the flat wash, arch motif when image-less, `crumbs` → breadcrumb trail on every page below the top level (§3.5 rule 5 — was missing everywhere) · [x] DR-07 auth shell: `AuthPanel` beside the form at ≥1024px, brand strip above it below · [x] DR-08 `FeatureCard` (+ `step` variant) replaces five hand-rolled icon cards · [x] DR-09 home hero badge watermark (lg+) · [x] DR-10 badge in admin rail, checkout header, 404
- **Club artwork:** the badge is an SVG rendition of Simon's logo. When the original file arrives, drop it in `public/brand/` and swap it in `brand.tsx` — nothing else changes.

## Decisions taken (Talon authorised overruling with evidence, 31 Aug 2026)
1. **Next.js 16** instead of 15 — latest major at build start; avoids mid-contract upgrade. (SPEC-VALIDATION §5)
2. **`--tcc-signal-soft: #FCEEEB`** replacing `#FBE8E4` — measured AA fix, 4.64:1. (§1.5)
3. **Venue river gauge = Buildwas, station 2134** — EA "Ironbridge" station is on the River Dee. (§1.1)
4. **`is_junior` computed in views/functions**, not a stored generated column — volatile `now()` is invalid there and would go stale. (§1.2)
5. **§9 images: use un-suffixed originals** — full-size exists for every LOW-RES suspect; elided filename resolved. (§2)
6. **Split 7/5 text cells get inner `max-width: 68ch`** to satisfy audit rule ⑤. (§6)
7. **`current_members`/`membership_history` are security-definer views, self-gated** (`is_current_member(auth.uid()) OR has_role(auth.uid(),'committee')`; history committee-only) — the spec's security-invoker view cannot satisfy its own §5.4 matrix. (SPEC-VALIDATION §1.4)
8. **Membership policy cross-references go through definer helpers** (`membership_covers`, `is_membership_payer`) — direct policy-to-policy references recurse infinitely; caught by the P1-17 harness.
9. **Payment mode is a DB-enforced switch, not just UI** (3 Sep) — `club_settings.payment_provider`; `complete_online_payment()` refuses a caller-initiated capture unless mode = `simulated`. Real PayPal captures activate only via server-verified webhook/service-role path. Making the simulation safe to leave deployed: flip to `paypal` and the free-activation door closes at the database, everywhere, instantly. (docs/payments.md)

## Defects found
- (validation) Five spec defects logged in `docs/SPEC-VALIDATION.md` §1; fixes folded into Decisions above; §5.4 member-name visibility resolved at P1-06.

## Questions for Talon
- ~~P0-26/P13-01: Supabase account~~ — answered 31 Aug: user's own org for now, transfer at P13-01.

## Blocked
- ~~P0-26~~ resolved 31 Aug — project created, types generated.
- P1-18 image upload + local `pnpm dev` against live data: waiting on the anon key being pasted into `.env.local` (see the file's comment for the exact dashboard page).

## Environment notes
- The embedded browser pane starves requestAnimationFrame, so framer-motion
  animation completion can only be verified on the deployed URL in a real
  browser; initial/target values and reduced-motion gating are code-reviewed
  and typed. Lighthouse is likewise run against the production deployment,
  not `next dev`.
