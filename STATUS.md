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

## Phase 2 — Public site
- [ ] P2-01 hero · [ ] P2-02 three sports · [ ] P2-03 events strip · [ ] P2-04 news · [ ] P2-05 venue strip · [ ] P2-06 join CTA · [ ] P2-07 /paddlesports · [ ] P2-08 whitewater · [ ] P2-09 freestyle · [ ] P2-10 SUP · [ ] P2-11 /about · [ ] P2-12 committee · [ ] P2-13 role-descriptions · [ ] P2-14 policies · [ ] P2-15 privacy · [ ] P2-16 /venue · [ ] P2-17 /events · [ ] P2-18 event detail · [ ] P2-19 news pages · [ ] P2-20 /join · [ ] P2-21 /contact · [ ] P2-22 CMS route · [ ] P2-23 metadata/sitemap/robots

## Phase 3 — Auth and onboarding
- [ ] P3-01 register · [ ] P3-02 verify · [ ] P3-03 login · [ ] P3-04 reset · [ ] P3-05 /welcome tier step · [ ] P3-06 guards + layouts

## Phase 4 — Membership and payments
- [ ] P4-01 PayPal lib · [ ] P4-02 checkout · [ ] P4-03 webhook · [ ] P4-04 notifications · [ ] P4-05 /members/membership · [ ] P4-06 record payment · [ ] P4-07 admin actions · [ ] P4-08 crons · [ ] P4-09 docs/payments.md

## Phase 5 — Events and bookings
- [ ] P5-01 admin list · [ ] P5-02 event form · [ ] P5-03 media manager · [ ] P5-04 booking action · [ ] P5-05 booking emails · [ ] P5-06 my bookings · [ ] P5-07 admin bookings · [ ] P5-08 ics feeds

## Phase 6 — Document library
- [ ] P6-01 upload · [ ] P6-02 supersede · [ ] P6-03 public policies · [ ] P6-04 members library · [ ] P6-05 review-due widget

## Phase 7 — Committee CMS
- [ ] P7-01 Tiptap editor · [ ] P7-02 renderer · [ ] P7-03 pages CRUD · [ ] P7-04 news CRUD · [ ] P7-05 nav builder

## Phase 8 — Members area
- [ ] P8-01 dashboard · [ ] P8-02 notices · [ ] P8-03 profile · [ ] P8-04 bottom tabs

## Phase 9 — Admin directory and segments
- [ ] P9-01 overview · [ ] P9-02 members table · [ ] P9-03 filter builder · [ ] P9-04 segments · [ ] P9-05 bulk actions · [ ] P9-06 member record · [ ] P9-07 add member · [ ] P9-08 settings · [ ] P9-09 committee admin · [ ] P9-10 audit viewer

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

## Decisions taken (Talon authorised overruling with evidence, 31 Aug 2026)
1. **Next.js 16** instead of 15 — latest major at build start; avoids mid-contract upgrade. (SPEC-VALIDATION §5)
2. **`--tcc-signal-soft: #FCEEEB`** replacing `#FBE8E4` — measured AA fix, 4.64:1. (§1.5)
3. **Venue river gauge = Buildwas, station 2134** — EA "Ironbridge" station is on the River Dee. (§1.1)
4. **`is_junior` computed in views/functions**, not a stored generated column — volatile `now()` is invalid there and would go stale. (§1.2)
5. **§9 images: use un-suffixed originals** — full-size exists for every LOW-RES suspect; elided filename resolved. (§2)
6. **Split 7/5 text cells get inner `max-width: 68ch`** to satisfy audit rule ⑤. (§6)
7. **`current_members`/`membership_history` are security-definer views, self-gated** (`is_current_member(auth.uid()) OR has_role(auth.uid(),'committee')`; history committee-only) — the spec's security-invoker view cannot satisfy its own §5.4 matrix. (SPEC-VALIDATION §1.4)
8. **Membership policy cross-references go through definer helpers** (`membership_covers`, `is_membership_payer`) — direct policy-to-policy references recurse infinitely; caught by the P1-17 harness.

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
