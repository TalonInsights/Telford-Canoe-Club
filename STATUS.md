# TCC build status

Spec: `docs/TCC-BUILD-SPEC-v2.0.md` · Validation: `docs/SPEC-VALIDATION.md` · Rule: a task is ticked only when its acceptance line is demonstrably true.

## Phase 0 — Scaffold, tokens, component sourcing, shell
- [x] P0-01 Init Next + TS strict + Tailwind v4 + pnpm; ESLint/Prettier; CLAUDE.md; STATUS.md; .env.example; design-decisions — `pnpm build` passes (Next 16.3.3, React 19.2.8, Tailwind v4, TS strict)
- [x] P0-02 shadcn init (radix base, CSS vars, neutral); 21st via connected MCP (live search verified); docs/components.md created
- [x] P0-03 Fonts + tokens + contrast script — 20 pairs pass; h1 Bricolage 44px on foam verified in browser
- [x] P0-04 shadcn primitives tokenised on /dev/ui — axe 0 violations (fixed tabs inactive contrast)
- [x] P0-05 Layout system on /dev/layout — mechanical audit at 375/768/1280: every row full, equal heights, one left edge, no h-scroll; 7-item case = 4+3 span-balanced
- [ ] P0-06 Header + MobileNav
- [ ] P0-07 Footer
- [ ] P0-08 HomeHero
- [ ] P0-09 SportCard/NewsCard/EventCard (one anatomy)
- [ ] P0-10 PricingTiers
- [ ] P0-11 FaqAccordion
- [ ] P0-12 CommitteeGrid
- [ ] P0-13 EventCalendar
- [ ] P0-14 DatePicker/DateTimePicker
- [ ] P0-15 FileUpload
- [ ] P0-16 ImageGallery
- [ ] P0-17 DataTable
- [ ] P0-18 StatCard
- [ ] P0-19 AdminSidebar + BottomTabBar
- [ ] P0-20 EmptyState
- [ ] P0-21 Stepper
- [ ] P0-22 SignInForm/SignUpForm
- [ ] P0-23 Timeline
- [ ] P0-24 DateTime/Money helpers + unit tests
- [ ] P0-25 not-found/error/loading
- [ ] P0-26 Supabase project + lib/supabase + types
- [ ] P0-27 Vercel linked, preview deploys, env vars

## Phase 1 — Database schema, RLS, seed
- [ ] P1-01 enums · [ ] P1-02 profiles+triggers · [ ] P1-03 membership_periods · [ ] P1-04 memberships · [ ] P1-05 membership_members · [ ] P1-06 views · [ ] P1-07 role/member functions · [ ] P1-08 events/bookings/media · [ ] P1-09 documents · [ ] P1-10 pages/posts · [ ] P1-11 committee_roles/notices · [ ] P1-12 segments · [ ] P1-13 email tables · [ ] P1-14 audit_log · [ ] P1-15 import_batches · [ ] P1-16 storage buckets · [ ] P1-17 RLS harness · [ ] P1-18 seed

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

## Defects found
- (validation) Five spec defects logged in `docs/SPEC-VALIDATION.md` §1; fixes folded into Decisions above; §5.4 member-name visibility resolved at P1-06.

## Questions for Talon
- P0-26/P13-01: which account owns the dev Supabase project (Talon dev then transfer, or club org from day one)? Blocking only the cloud project, not the code.

## Blocked
- P0-26 (cloud project + generated types): BLOCKED on the Supabase account decision above. Code scaffolding proceeds.
