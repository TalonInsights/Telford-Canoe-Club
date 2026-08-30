# Telford Canoe Club — Website Build Specification v2.0

Client: Telford Canoe Club (TCC), Jackfield Rapids, The Lloyds, Ironbridge, Telford TF8 7HJ
Client contact: Simon Wiles (Chair), committee member David
Delivered by: Talon Insights
Spec date: 31 August 2026
Version notes: v1.1 switched payments to PayPal; v2.0 rewrites §3 with justified design decisions, measured contrast, balance arithmetic, UX rules and component sourcing from shadcn/ui + 21st.dev; adds §2.5 conventions and revises Phase 0.
Status: DRAFT — for Claude Code execution once client decisions in §11 are closed

---

## 0. Operating rules for Claude Code (read before anything else)

This spec is executed **one phase at a time**. Each phase is self-contained and ends with acceptance criteria. Do not begin a phase until the previous phase's acceptance criteria are all ticked in `STATUS.md`.

1. **Migration plan first.** Before writing any code in a phase, write a short plan into `docs/plans/phase-XX.md` listing the files you will create or touch, in order. Then execute that plan top to bottom.
2. **One element at a time.** Within a phase, complete one component, one table, or one route fully (including types, loading state, empty state, error state, and mobile layout) before starting the next. Never scaffold five things at once and "come back later".
3. **Track progress in `STATUS.md`.** Every task in this spec has an ID (e.g. `P2-04`). Tick it only when its acceptance line is true. If a task is blocked on client input, mark it `BLOCKED: reason` and move to the next unblocked task in the same phase — never skip to a later phase.
4. **Do not touch other phases' files.** Each phase lists what it owns. If you find a defect in earlier-phase code, log it in `STATUS.md` under "Defects found" and fix it only if it blocks the current task.
5. **No placeholder tokens.** Never leave `TODO`, `lorem ipsum`, `{{...}}`, `#000`, or `example.com` in shipped code. Use the placeholder content in §9 and §10, which is real TCC content.
6. **Typecheck and lint after every task.** `pnpm typecheck && pnpm lint` must pass before a task is ticked. `pnpm build` must pass before a phase is ticked.
7. **Mobile first, then desktop.** Build every view at 375px first, then 768px, then 1280px. The committee will administer this site from phones.
8. **Commit per task.** Commit message format: `P2-04: event card component`. Push at the end of every phase.
9. **Ask, don't guess.** If a requirement is ambiguous and not covered by §11, write the question into `STATUS.md` under "Questions for Talon" and pick the most conservative interpretation to keep moving.
10. **Security is not a phase.** RLS is on from the moment a table exists. Service-role keys never reach the client. Every server action validates input with Zod and checks role.
11. **Components are sourced, not invented.** Primitives come from shadcn/ui; blocks come from 21st.dev following the §3.6 protocol. Candidate URLs must come from a live `21st search` or the category page — never from memory. Every choice is logged in `docs/components.md` with URL, author, licence and what was changed.
12. **Balance audit before ticking a page.** Run the five-point alignment audit in §3.4 and the UX rules in §3.5 at 375px and 1280px, and paste the result under the task in `STATUS.md`.

---

## 1. Project summary

### 1.1 What the club has now
- WordPress 7.1 site, Lightning theme (Vektor), ARMember membership plugin, PayPal payments, an events plugin with booking, hosted on the previous chair's personal server.
- Membership tiers: Single Adult £25, Single Junior (U18) £15, Family £40 — all expire 31 December.
- Signup captures: username, first/last name, email, password, address inc. postcode, phone, BC (Paddle UK) membership number, parent/guardian name, list of family member names, avatar, risk acknowledgement, rules acceptance.
- Known pain: nobody can tell who is a current paid member vs a registered-but-unpaid account; emailing members is hard; content is hard to maintain; hosting is a single point of failure.

### 1.2 What the club needs (consolidated from Simon and David)
| ID | Requirement | Source |
|---|---|---|
| R1 | Public informative content about the club, sports, venue, history, committee, contact | Simon |
| R2 | Membership management that unambiguously distinguishes paid-up members from registered non-payers, per tier | Simon, David |
| R3 | System "knows" when someone has paid and records + notifies member and committee; manual fallback for offline payment | David |
| R4 | Email all members or filtered subsets easily (e.g. "all paid-up members", "lapsed members from last year") | Simon, David |
| R5 | Events calendar with attendee sign-up / booking, with photos and video | Simon, David |
| R6 | Document library for policies and procedures (most not yet uploaded) | Simon |
| R7 | Members-only area accessible to paid-up members only | David |
| R8 | Record previous paid-up members for up to 5 years | David |
| R9 | Easy for non-technical committee to add/edit/delete pages, news, events without a developer | David, Simon |
| R10 | Migrate as much existing data as possible, especially membership records | David |
| R11 | Independent hosting fully under committee control | Simon, David |
| R12 | Maintenance contract with Talon Insights | Simon |
| R13 | Plain-language querying and instructions (interpreted — see §1.3) | David |

### 1.3 Interpretation decisions already made
- **R13 is delivered as a structured admin, not a natural-language interface.** Every example David gave ("make a list of all current paid-up adult members", "email this new gate code to all paid-up members", "create a page called…") must be achievable in ≤3 clicks from the admin dashboard using filters, saved segments and a page editor. A read-only "Ask" assistant is an optional v2 (§7 Phase 14) and is not part of the launch scope.
- **Payments use PayPal Checkout** (the club's existing PayPal account) with a webhook that creates the membership record automatically. Manual "mark as paid" exists for cash/bank transfer.
- **Videos are embedded** (YouTube / Vimeo URL), not uploaded. Photos are uploaded to Supabase Storage.
- **Membership is a table, not a flag.** See §5.

---

## 2. Stack, hosting and repository

### 2.1 Stack (Talon Insights Baseline)
| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript strict | Server components by default; client components only where interaction requires |
| Styling | Tailwind CSS v4 with CSS-variable tokens (§3) | No component library; hand-built primitives in `components/ui` |
| Motion | Framer Motion | One orchestrated hero reveal; otherwise motion only on user action |
| Backend | Supabase Pro — Postgres, Auth, Storage, Edge Functions | UK/EU region (London `eu-west-2`) |
| Payments | PayPal Checkout (JS SDK, Orders API v2) + Webhooks | GBP, one-off annual orders; club's existing PayPal business account |
| Email | Resend | Transactional + campaign sending from `@telfordcanoeclub.co.uk` |
| Forms/validation | React Hook Form + Zod | Shared schemas in `lib/schemas` |
| Rich text | Tiptap | Committee page/news editor; stores JSON, renders to HTML server-side |
| Calendar export | `ics` package | Per-event `.ics` and a club-wide subscription feed |
| Hosting | Vercel (Pro not required at launch) | Project owned by a `tech@telfordcanoeclub.co.uk` account, not Talon's |
| Domain/DNS | Existing registrar → Vercel nameservers or CNAME | Committee owns registrar login |
| Monitoring | Vercel Analytics + Supabase logs; Sentry optional | |
| Package manager | pnpm | |

### 2.2 Environment variables (`.env.example` must list all of these)
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
PAYPAL_ENV=sandbox                   # sandbox | live
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=                # server only
PAYPAL_WEBHOOK_ID=                   # from PayPal developer dashboard, used for signature verification
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
MEMBERSHIP_PRICE_ADULT_PENCE=2500    # prices live in admin settings; env is the seed default
MEMBERSHIP_PRICE_JUNIOR_PENCE=1500
MEMBERSHIP_PRICE_FAMILY_PENCE=4000
RESEND_API_KEY=
EMAIL_FROM="Telford Canoe Club <hello@telfordcanoeclub.co.uk>"
EMAIL_COMMITTEE=committee@telfordcanoeclub.co.uk
CRON_SECRET=
```

### 2.3 Repository layout
```
tcc-website/
├── app/
│   ├── (public)/            # marketing + info pages, no auth
│   ├── (auth)/              # login, register, reset, verify
│   ├── (members)/members/   # gated to current paid members
│   ├── (admin)/admin/       # gated to committee/admin roles
│   ├── api/
│   │   ├── paypal/webhook/route.ts
│   │   ├── calendar/feed.ics/route.ts
│   │   └── cron/            # renewal reminders, expiry sweep
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── sitemap.ts, robots.ts
├── components/
│   ├── ui/                  # Button, Input, Select, Dialog, Sheet, Table, Badge, Tabs, Toast
│   ├── layout/              # Header, Footer, MobileNav, Container, Section, PageHero
│   ├── site/                # public-page blocks (SportCard, EventCard, NewsCard, CommitteeCard…)
│   ├── members/
│   ├── admin/
│   └── editor/              # Tiptap wrapper + renderer
├── lib/
│   ├── supabase/            # client.ts, server.ts, admin.ts, middleware.ts
│   ├── paypal.ts             # access token, create order, capture order, verify webhook signature
│   ├── email/               # resend.ts + react-email templates
│   ├── schemas/             # zod
│   ├── auth/                # getSession, requireRole, requireCurrentMember
│   ├── queries/             # typed data access, one file per domain
│   └── utils/
├── supabase/
│   ├── migrations/          # timestamped SQL, one concern per file
│   ├── seed.sql
│   └── functions/           # edge functions if needed
├── scripts/
│   └── import-armember.ts   # Phase 11
├── public/images/placeholders/   # §9
├── docs/plans/phase-XX.md
├── docs/components.md       # sourcing log (§3.6)
├── docs/design-decisions.md # copy of §3 for the repo
├── STATUS.md
└── CLAUDE.md                # points at this spec + operating rules
```

### 2.4 `CLAUDE.md` contents (create in Phase 0)
Short file: link to this spec, restate §0 rules 1–12, list the commands (`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm supabase:migrate`, `pnpm supabase:types`, `21st search`), and the rule "never edit generated `types/database.ts` by hand".

### 2.5 Conventions carried over from previous Talon Insights builds (David Jackson & Son, WulfTek, Evason, taloninsights.co.uk)
These are the working patterns Claude Code has already used successfully with Talon and must keep using here:
- **TypeScript strict, no `any`.** Generated Supabase types (`types/database.ts`) are the single source of truth for row shapes; domain types derive from them via `Tables<'memberships'>` helpers.
- **Zod schemas shared** between client forms and server actions in `lib/schemas/*`; the server never trusts the client.
- **Server actions over API routes** for mutations (API routes only for webhooks, cron and file streams). Every action: `requireRole()` → parse with Zod → do work → `audit()` → `revalidatePath()`.
- **Typed query layer** in `lib/queries/<domain>.ts`; pages never call Supabase directly.
- **Design tokens as CSS variables** first, Tailwind theme mapped to them (the taloninsights.co.uk v3.5 token pattern); never raw hex in components.
- **Sentence-case headings** as a house style (established on WulfTek).
- **SVG assets inline** where they must be recoloured by tokens (logo, paddle glyph), `next/image` for photography.
- **Framer Motion** for the one hero moment and interaction feedback only.
- **Migration-plan-first prompting**: `docs/plans/phase-XX.md` before code, as on Evason.
- **Deployment pipeline** Claude Code → GitHub → Vercel with preview URLs on every PR; env vars set in Vercel, never committed.
- **QA with Talon's own Claude Skills**: run `site-audit` and `website-assessment` against the preview URL at the end of Phase 2 and Phase 12 and log findings in `STATUS.md`.
- **Standalone-HTML tooling not used here** — the WulfTek hash-router pattern is for single-file sites; this project is App Router throughout.

---

## 3. Design system — every choice justified

### 3.1 Direction and why
**Brief:** a volunteer-run whitewater club on the Severn wants a site that is "stylish but simple and sleek", uses the page well, has no uneven gaps, and is maintainable by non-technical committee members from their phones.

**Direction:** *river-first editorial.* Photography of moving water carries the emotion; the type and layout stay disciplined so that committee-authored content (which will vary wildly in length and quality) always sits inside a rigid, balanced frame. This is the single most important design decision: **the grid protects the design from the content.** A club site is not a brand launch — it is read on a phone in a car park to check whether tonight's paddle is on.

**What we deliberately reject and why**
| Rejected | Reason |
|---|---|
| Warm cream + terracotta + serif display | Reads as a generic AI/agency template in 2026; also wrong temperature for cold water |
| Near-black + neon accent | Fashion/tech connotation; poor for a family club with juniors |
| Bento/SaaS card kit (identical rounded cards + soft shadows everywhere) | Cards for everything destroys hierarchy and makes uneven grids inevitable |
| All-caps tracked eyebrow labels, `01/02/03` markers, `→` on links | Decoration without information; the frontend-design skill flags these as tells |
| Scroll-triggered fade-ups on every section | Motion should answer an action, not delay reading; also hurts LCP/INP on phones |
| Hero with big number + stats + gradient | Club has no impressive stats to show yet |

### 3.2 Colour — tokens, rationale, measured contrast
All ratios computed (WCAG 2.2 relative luminance). AA = 4.5:1 normal text, 3:1 large text/UI.

| Token | Hex | Role | Why this colour | Contrast |
|---|---|---|---|---|
| `--tcc-deep` | `#0E2F3C` | Primary dark: header, hero overlay, footer, primary buttons, members/admin rail | Deep-water teal-navy; darker than the river photography so white type reads on it, but not black (which flattens photos). Anchors the page top and bottom for balance | 14.1:1 on white, 13.0:1 on foam |
| `--tcc-river` | `#1F5F6E` | Links on light, focus rings, secondary buttons, active tab underline | Mid river tone; distinguishable from `deep` by one clear step so hierarchy is visible | 7.2:1 on white; white on it 7.2:1 |
| `--tcc-foam` | `#F3F6F5` | Page background | Cool off-white, not cream — the temperature of whitewater foam. Gives white cards a lift without shadows | — |
| `--tcc-stone` | `#DCE3E1` | Borders, dividers, table rules, skeletons | One step below foam; borders define structure instead of shadows | 10.8:1 as text on deep (used for footer secondary) |
| `--tcc-ink` | `#14232A` | Body text on light | Tinted near-black in the deep hue family, so text and headers feel like one system | 16.1:1 on white |
| `--tcc-signal` | `#C93518` | The single accent: primary CTA, "Book now", live/urgent badge, active nav | Taken from the club's red kayaks and buoyancy aids (Simon's profile photo). Original pick `#E4432B` measured 4.09:1 and failed AA for button text; deepened to pass | 5.2:1 on white; white on it 5.2:1 |
| `--tcc-signal-soft` | `#FBE8E4` | Accent tint for badges/alerts backgrounds | Same hue at 8% so badges read as related to the CTA | with `signal` text 4.6:1 |
| `--tcc-success` | `#1E7F4F` | Paid/active/confirmed | Green must be distinguishable from `river` teal for colour-blind users: it is warmer and lighter; always paired with the word "Active" | 5.0:1 on white |
| `--tcc-warn` | `#8A5A12` | Expiring/pending | Original `#B7791F` measured 3.6:1 and failed; darkened | 5.9:1 on white |
| `--tcc-white` | `#FFFFFF` | Cards on foam, text on deep | — | — |

**Usage rules:** one `signal` element per viewport (the thing we want tapped). Status is never colour-only — every badge carries a word. Dark mode is **not** built (committee editing content in two themes doubles QA and the photography is designed for the light frame).

### 3.3 Typography — selection and rationale
| Role | Face | Why |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (Google Fonts, variable, OFL) | A grotesque with visible character — slightly narrow, sturdy, a little rough at the corners — which suits a club that builds its own car park. Distinct from Inter/Geist/Space Grotesk defaults. Variable optical size means the same file works from 20px to 64px. Free and self-hosted via `next/font` (no Google request, no cookie banner) |
| Body / UI | **Figtree** (Google Fonts, variable, OFL) | Humanist-geometric with open apertures and tall x-height, so 16px is comfortably legible on a phone in daylight; quieter than Bricolage so the pairing has clear contrast (display has personality, body disappears). Also free and self-hosted |

**Scale:** major-third ratio (1.25) from a 16px base — small enough that six steps fit a phone without huge jumps, consistent enough that all headings relate.
| Step | Desktop | Mobile | Line-height | Use |
|---|---|---|---|---|
| h1 | 44px (2.75rem) | 32px | 1.1 | Page titles, hero |
| h2 | 32px | 26px | 1.15 | Section titles |
| h3 | 22px | 20px | 1.25 | Card titles |
| h4 | 18px | 18px | 1.3 | Sub-heads, table headers |
| body | 16px | 16px | 1.55 | Prose |
| small | 14px | 14px | 1.45 | Meta, captions, table cells |
| micro | 13px | 13px | 1.4 | Badges, helper text (never below 13px) |

Rules: sentence case everywhere (a brand decision — friendlier, and it removes the "ALL CAPS LABEL" tell); measure 60–68ch on prose; headings `letter-spacing: -0.02em` at h1 only; no italics for emphasis in UI (use weight 600); numbers in tables use `font-variant-numeric: tabular-nums` so columns align.

### 3.4 Layout — balance rules with the arithmetic
Everything below exists to make "no uneven gaps" a property of the system rather than a review comment.

**Grid.** 12 columns, 24px gutter (16px < 768px), container `max-width: 1200px` = 12 × 78px + 11 × 24px. Content never uses arbitrary widths; components declare spans.

**Spacing scale** (4px base): 4, 8, 12, 16, 24, 32, 48, 64, 96. Section padding is only `--space-section` (96 desktop / 64 mobile) or `--space-section-tight` (64 / 40). Within a section, the gap between title block and content is always 32 (desktop) / 24 (mobile). Because every section uses the same two values, the page has a metronome rhythm and adjacent sections can't drift.

**Section shapes — exactly three allowed.** Every section on every page is one of:
1. **Full-grid** — 12 columns of equal-height items (cards, committee, documents, events).
2. **Split 7/5** — text spans 7, image spans 5 (58%/42%, close to golden ratio, so the image has visual weight without dominating; the text column at 7/12 of 1200 ≈ 660px ≈ 68ch at 16px, which is the target measure). Alternates sides section to section. Image `object-cover` fills the cell height; text is vertically centred.
3. **Centred column** — title/intro/prose at `max-width: 720px`, centred (`col-start-3 col-span-8`). Used for prose-only content (about, privacy, CMS pages) so long text doesn't stretch across 1200px.
No fourth shape without a spec change. This is what keeps pages "even": all sections share edges.

**Heroes.** Fixed heights so content length never changes the fold: home `min-height: 72svh` desktop / `80svh` mobile; inner pages `PageHero` 320px desktop / 240px mobile with 16:9 image (4:5 crop on mobile via `object-position`). Title and intro left-aligned on the grid (col 1–8) — left alignment makes the ragged edge predictable and the reading start consistent with the nav logo.

**Cards.** One anatomy: image 3:2 → title h3 → 2-line clamp summary → meta row → footer (`mt-auto`). `grid-auto-rows: 1fr` + `flex-col h-full` on every card guarantees equal heights whatever the copy length. Border `1px stone`, radius 12px, no shadow; hover = border becomes `river` (information: it's interactive).

**Orphan rule (implemented in `useBalancedColumns(count, max)`).** For n items at a max of c columns: if `n % c === 0` use c; else try c-1 down to 2 for zero remainder; if none, use c and make the last row span (`col-span` the remainder evenly, e.g. 2 items in a 3-col grid each span 1.5 → we use a 6-col sub-grid so 2 items span 3 each). Result: no row is ever visibly short. Committee page with 7 roles → 4-col rows of 4 + 3 fails → 3-col gives 3+3+1 fails → fallback 4-col with last row 3 centred by span math.

**Images.** Fixed aspect boxes always; images never set height. Missing image → tinted `deep` block with a white paddle-blade SVG glyph at 20% opacity (still fills the box, so grids stay even).

**Empty states** render inside the same box as one row of content (`min-height` = one card row) with icon, one sentence, one action. Sections never collapse.

**Members/admin shells.** Left rail 240px (≥1024px) with the content area using its own 12-col grid inside `max-width: 1100px`; on mobile a 5-item bottom tab bar (56px, safe-area padded). Data tables are full width of the content area with 16px cell padding; first column sticky.

**Alignment audit (run before ticking any page task):** ① all section left edges align with the logo; ② no two adjacent sections share the same background tone (foam/white/deep alternate) unless separated by a `stone` rule; ③ last row of every grid is full or span-balanced; ④ no image box is a different ratio from its siblings; ⑤ no text block wider than 68ch.

### 3.5 UX/UI rules (applied to every screen)
Grounded in WCAG 2.2 AA, Nielsen's heuristics and GOV.UK/Smashing form conventions — chosen because the users are volunteers on phones, not power users.
1. **Touch targets ≥ 44×44px**, 8px minimum between targets. Applies to nav, table row actions, calendar days.
2. **Forms:** label above field (not placeholder-as-label); helper text under; validate on blur, re-validate on change; error text in `signal` with icon and specific fix ("Enter a postcode like TF8 7HJ"); error summary at top on submit; one column only; primary action left, secondary as ghost to its right; disabled submit only while submitting (never on "invalid" — show errors instead).
3. **Feedback on every action:** toast for success, inline for errors; destructive actions (delete page, cancel membership, send campaign) use a confirm dialog that names the object and count ("Send to 84 members?").
4. **Visible focus** 2px `river` ring with 2px offset on every interactive element; skip-link first in DOM.
5. **Navigation depth ≤ 2**; breadcrumbs on every page below the top level; current page marked `aria-current`.
6. **Status is text + colour + icon**, never colour alone.
7. **Tables:** sort by clicking header (aria-sort), sticky header, filters above table with active-filter chips and a "Clear all", row click opens record, bulk-select checkbox column, count shown ("84 members"). Mobile: horizontal scroll with pinned first column; never a card-list transformation (it hides comparisons).
8. **Loading:** skeletons matching final layout (no spinners in content areas); optimistic UI for booking/cancel with rollback.
9. **Copy:** sentence case; verbs on buttons ("Save changes", "Record payment"); the button, the toast and the audit entry use the same verb; errors say what happened and what to do; empty states invite the next action.
10. **Reduced motion** honoured; **no auto-playing video**; embeds click-to-load.
11. **Admin 3-click rule:** every task in `docs/admin-guide.md` must be reachable in ≤ 3 clicks from `/admin` on a phone.

### 3.6 Component sourcing — shadcn/ui primitives + 21st.dev blocks

**Policy.** Low-level primitives come from **shadcn/ui** (the base 21st.dev is built on) so their APIs are canonical; higher-order blocks come from **21st.dev** after a search of the relevant category. Both install into `components/ui` as owned source, then are re-styled to §3.2–3.4 tokens. Nothing is used as-installed: every component is adapted (tokens, sentence case, focus ring, sizes) and the adaptation is recorded.

**Setup (Phase 0, P0-02).**
```
npm i -g @21st-dev/cli        # unified CLI; `21st login` opens browser, or API_KEY_21ST in CI
claude mcp add 21st -- npx -y @21st-dev/cli mcp   # if using the MCP route inside Claude Code
npx shadcn@latest init        # Tailwind v4, CSS variables, base colour: neutral (we override)
```
Note: 21st.dev search is free; installs are capped at two per day on the free tier. Talon Insights runs the build on a paid 21st plan for the Phase 0 sourcing sprint, or spreads installs across days — either way, `21st search` returns the real source, which Claude Code may read and port under the component's MIT licence when the install cap is hit. Record the source URL and licence in `docs/components.md` in both cases.

**Selection protocol (mandatory per block).**
1. Open the category page (URLs below) and run `21st search "<query>"`.
2. Shortlist ≥ 3 candidates. Reject any that: use `styled-components`/CSS-in-JS; are dark-mode-only; depend on libraries outside our stack (allowed: `framer-motion`/`motion`, `lucide-react`, `@radix-ui/*`, `date-fns`, `@tanstack/react-table`, `react-day-picker`, `embla-carousel-react`, `sonner`, `react-hook-form`, `zod`); have no keyboard support; hard-code colours that can't be tokenised in < 30 minutes; are marketing gimmicks (3D, shaders, cursors, marquees).
3. Score 1–5 on: accessibility, code clarity, fit to §3.4 shapes, mobile behaviour, dependency weight. Pick the highest; write the decision (URL, author, score, what was changed) to `docs/components.md`.
4. Install (`npx shadcn@latest add <registry URL>` or `21st add`), rename to our component name, tokenise, add missing states (loading/empty/error/disabled), run axe, add to `/dev/ui`.

**Sourcing map.** Category URLs verified on 21st.dev (pattern `https://21st.dev/community/components/s/<category>`). Specific component picks are made by Claude Code following the protocol — candidate URLs must come from the search, never from memory.

| Our component | Source | Category / search | Must have | Adapt |
|---|---|---|---|---|
| Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Badge, Dialog, Sheet, Tabs, Tooltip, Popover, DropdownMenu, Skeleton, Toast (sonner), Avatar, Accordion, Breadcrumb, Pagination, Table (base) | shadcn/ui | `npx shadcn@latest add button input textarea select checkbox radio-group switch badge dialog sheet tabs tooltip popover dropdown-menu skeleton sonner avatar accordion breadcrumb pagination table` | — | Tokens, radius 8px controls / 12px surfaces, sizes sm 36 / md 44 / lg 52px, sentence case |
| `Header` + `MobileNav` | 21st.dev | `/s/navbar`, `/s/navigation-menu` — search "sticky navbar with mobile sheet" | Solid sticky bar (not floating — density matters, see category guidance), keyboard-navigable, focus-trapped mobile drawer, supports a right-side CTA slot | Logo slot, `signal` active underline, members/admin variant |
| `Footer` | 21st.dev | `/s/footer` — "simple footer three columns" | 3–4 column, no newsletter form, no social-only footers | Address + affiliation + policies |
| `HomeHero` | 21st.dev | `/s/hero` — "hero with background image overlay left aligned" | Image background with overlay, left-aligned text, two CTAs, no video, no particle/shader | Fixed `svh` heights, single orchestrated reveal, 4:5 mobile crop |
| `PageHero` | build (from shadcn primitives) | — | — | Too specific to source |
| `SportCard`, `NewsCard`, `EventCard` | 21st.dev | `/s/card` — "image card with title description and meta" | Image-top, equal-height friendly (no fixed height), no hover-lift shadows | One anatomy (§3.4), `mt-auto` footer |
| `PricingTiers` (join page) | 21st.dev | `/s/pricing` — "three tier pricing cards simple" | No monthly/annual toggle, no "most popular" ribbon by default, feature list | Adult/Junior/Family, "Runs to 31 December" |
| `FaqAccordion` | shadcn Accordion + 21st `/s/faq` for layout | "faq two column" | Single-open, accessible | — |
| `CommitteeGrid` | 21st.dev | `/s/team` — "team section grid with avatar name role" | Avatar fallback initials, no social icons | Vacant-role card variant |
| `EventCalendar` (month grid) | 21st.dev | `/s/calendar` — "event calendar month view" | Month grid with event chips, keyboard month navigation, `date-fns` | Category colours (text + dot), mobile list fallback |
| `DatePicker`, `DateTimePicker` (admin forms) | 21st.dev | `/s/date-picker` — "date time picker range" | `react-day-picker` based, Europe/London | — |
| `FileUpload` (documents, event media, avatar) | 21st.dev | `/s/file-upload` — "drag and drop file upload with progress and preview" | Multi-file, progress, type/size validation, keyboard operable | Supabase Storage adapter, image resize |
| `ImageGallery` (event media) | 21st.dev | `/s/gallery` — "image gallery grid with lightbox" | Lightbox with keyboard nav, lazy loading | 3:2 tiles, video embed tile |
| `DataTable` (members, bookings, campaigns) | 21st.dev | `/s/table` — "data table with sorting filtering pagination tanstack" | `@tanstack/react-table`, server-side pagination hook, row selection, sticky header | Filter chips, pinned first column, CSV export |
| `StatCard` (admin overview) | 21st.dev | `/s/stat` (Stats & KPIs) — "simple stat card with label value delta" | No sparkline gimmicks | Tabular nums |
| `AdminSidebar` + `BottomTabBar` | 21st.dev | `/s/sidebar` — "collapsible sidebar with nav groups" | Keyboard-navigable, collapsible, active state | 240px rail, mobile tab bar built separately |
| `EmptyState` | 21st.dev | `/s/empty-state` — "empty state with icon title description action" | — | Min-height rule |
| `Stepper` (register → tier → pay) | 21st.dev | `/s/stepper` — "horizontal stepper with progress" | aria-current step, mobile condensed | 3 steps |
| `SignInForm`, `SignUpForm` | 21st.dev | `/s/sign-in`, `/s/sign-up` — "simple sign in form email password" | react-hook-form compatible, no social buttons | Magic-link tab, junior guardian fields |
| `Timeline` (club history, membership history) | 21st.dev | `/s/timeline` — "vertical timeline simple" | No animation on scroll | — |
| `RichTextEditor` | Tiptap (not 21st) | — | — | Own toolbar per Phase 7 |
| `MonthPicker`, `SegmentBuilder`, `CampaignComposer` | build | — | — | Domain-specific |

**Icons:** `lucide-react` only (one weight, one style; 21st.dev components already use it).

### 3.7 Motion — one moment, then only responses
- Home hero: overlay settles (opacity 0→1, 400ms), h1 rises 12px and fades (500ms, ease-out), intro 100ms later, buttons 150ms later. Plays once per full page load; a module-level ref stops it replaying on client-side navigation.
- Interaction motion: sheet/dialog 200ms, accordion 180ms, tab underline 150ms layout animation, toast slide 200ms, booking button success tick 300ms.
- No scroll-triggered animation. No parallax. `prefers-reduced-motion: reduce` → all durations 0.
- Justification: motion budget spent where it signals state change; INP on a mid-range Android stays under 200ms.

---

## 4. Site map and routes

### 4.1 Public (no auth) — route group `(public)`
| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, three sports, upcoming events (3), latest news (3), join CTA, venue strip |
| `/paddlesports` | Paddlesports overview | Three sport cards + "who it's for" |
| `/paddlesports/whitewater-kayaking` | Whitewater | Migrated copy + 2 images |
| `/paddlesports/freestyle-kayaking` | Freestyle | Migrated copy + 2 images |
| `/paddlesports/paddleboarding` | SUP | Migrated copy + 2 images (redirect from old `/standup-paddleboard-sup`) |
| `/about` | About + history | Migrated copy |
| `/about/committee` | Committee | Cards from `committee_roles` |
| `/about/role-descriptions` | Club role descriptions | CMS page |
| `/about/policies` | Policies | Public documents from library (`visibility = public`) |
| `/about/privacy` | Privacy policy | CMS page, includes 5-year retention statement |
| `/venue` | Jackfield Rapids | Address, map embed, parking, gate/access notes (public-safe only), water-level link (EA gauge) |
| `/events` | Events list + month calendar toggle | Upcoming; past under a tab |
| `/events/[slug]` | Event detail | Description, media, book/register CTA, `.ics` download |
| `/news` | News list | Paginated |
| `/news/[slug]` | News post | |
| `/join` | Membership info + tiers + "Join" CTA | Public pricing |
| `/contact` | Contact form → committee email | Honeypot + rate limit |
| `/[slug]` | Generic CMS page | For committee-created pages (Phase 7) |

### 4.2 Auth — route group `(auth)`
`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` (magic-link landing), `/welcome` (post-register: choose tier → PayPal).

### 4.3 Members — `(members)/members`, requires `role ≥ member` AND current paid membership (see §6)
| Route | Page |
|---|---|
| `/members` | Dashboard: membership status card, next events, my bookings, documents shortcuts |
| `/members/membership` | Current + history, renew button, receipt links, family members |
| `/members/events` | My bookings, cancel |
| `/members/documents` | Members-only document library |
| `/members/profile` | Edit profile, BC number, emergency contact, email preferences |
| `/members/notices` | Members-only notices (gate code, etc.) |

Registered-but-unpaid users who hit `/members/*` are redirected to `/members/membership` which shows only "Your membership isn't active — choose a tier" and the PayPal buttons. That single page is allowed for `role = registered`.

### 4.4 Admin — `(admin)/admin`, requires `role IN (committee, admin)`
| Route | Page |
|---|---|
| `/admin` | Overview: paid members by tier, expiring in 30 days, unpaid registrations, next events, recent payments |
| `/admin/members` | Directory table: filters (status, tier, year, junior/adult, has BC number, joined range), saved segments, bulk select → email, CSV export |
| `/admin/members/[id]` | Member record: profile, membership history, bookings, emails received, notes, actions (mark paid, extend, refund note, deactivate) |
| `/admin/members/import` | Phase 11 importer |
| `/admin/events` + `/new` + `/[id]` | Event CRUD, bookings list, attendee export, media |
| `/admin/pages` + `/new` + `/[id]` | CMS pages (Tiptap) |
| `/admin/news` + `/new` + `/[id]` | News posts |
| `/admin/documents` | Upload, categorise, set visibility, reorder |
| `/admin/email` + `/new` + `/[id]` | Campaigns: pick segment, compose, preview, test-send, send; delivery stats |
| `/admin/committee` | Committee roles and who holds them (drives public committee page) |
| `/admin/settings` | Club details, tier prices (source of truth — orders are created server-side from these), membership year, email footer, notice text |
| `/admin/audit` | Audit log (admin only) |

### 4.5 API routes
`/api/paypal/webhook` (POST), `/api/calendar/feed.ics` (GET, public events), `/api/calendar/members.ics?token=` (GET, all events, per-member token), `/api/cron/expiry-sweep` (daily, `CRON_SECRET`), `/api/cron/renewal-reminders` (daily).

---

## 5. Data model (Supabase / Postgres)

All tables have `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz` (trigger). All tables have RLS **enabled** in the same migration that creates them. Migrations are numbered `0001_…` upward, one concern each.

### 5.1 Enums
```sql
create type app_role as enum ('registered', 'member', 'committee', 'admin');
create type membership_tier as enum ('adult', 'junior', 'family');
create type membership_status as enum ('pending', 'active', 'expired', 'cancelled', 'refunded');
create type payment_source as enum ('paypal', 'manual_bank', 'manual_cash', 'imported', 'complimentary');
create type visibility as enum ('public', 'members', 'committee');
create type booking_status as enum ('booked', 'waitlist', 'cancelled', 'attended', 'no_show');
create type campaign_status as enum ('draft', 'sending', 'sent', 'failed');
```

### 5.2 Tables

**`profiles`** — 1:1 with `auth.users`, created by trigger on signup.
```
user_id uuid pk references auth.users on delete cascade
role app_role not null default 'registered'
first_name text not null
last_name text not null
email text not null unique            -- mirrored from auth for querying
phone text
address_line1 text, address_line2 text, town text, postcode text
date_of_birth date                    -- required for junior determination
bc_membership_number text             -- Paddle UK / British Canoeing
emergency_contact_name text, emergency_contact_phone text
guardian_name text                    -- required when is_junior
medical_notes text                    -- members-visible-to-committee only
avatar_path text
email_opt_in boolean default true     -- club news; transactional always sent
legacy_arm_user_id int                -- from ARMember import
notes_internal text                   -- committee only
deactivated_at timestamptz
```
Generated column: `is_junior boolean` = `date_of_birth > (now() - interval '18 years')`.

**`membership_periods`** — one row per membership year the club runs.
```
id, label text ('2026'), starts_on date ('2026-01-01'), ends_on date ('2026-12-31'), is_current boolean
```
Only one row may have `is_current = true` (partial unique index). Cron `expiry-sweep` flips this on 1 Jan.

**`memberships`** — the core table. One row = one person (or family) paying for one period.
```
id
period_id references membership_periods
tier membership_tier not null
status membership_status not null default 'pending'
primary_user_id references profiles(user_id)   -- payer / account holder
amount_pence int not null
source payment_source not null
paypal_order_id text unique
paypal_capture_id text unique
paid_at timestamptz
recorded_by uuid references profiles(user_id)  -- committee user for manual
notes text
```
Indexes: `(primary_user_id, period_id)`, `(period_id, status)`.
Constraint: at most one `active` membership per `(primary_user_id, period_id)`.

**`membership_members`** — who is covered by a membership (1 row for adult/junior, n rows for family).
```
membership_id references memberships on delete cascade
user_id references profiles(user_id)           -- nullable if family member has no login
display_name text not null                     -- for family members without accounts
is_junior boolean not null default false
primary key (membership_id, coalesce(user_id, display_name))  -- implement via unique index on expression
```

**View `current_members`** (security invoker; used by members gate and admin):
```sql
select p.user_id, p.first_name, p.last_name, p.email, p.role, p.is_junior,
       m.id as membership_id, m.tier, m.status, m.paid_at, m.source, mp.label as period
from profiles p
join membership_members mm on mm.user_id = p.user_id
join memberships m on m.id = mm.membership_id and m.status = 'active'
join membership_periods mp on mp.id = m.period_id and mp.is_current;
```

**View `membership_history`** — every person × every period with status or `'none'`, for the "who was a member in 2023" queries. Materialised nightly if performance needs it (not expected at club scale).

**Function `is_current_member(uid uuid) returns boolean`** — `security definer`, used in RLS policies.
**Function `has_role(uid uuid, min app_role) returns boolean`** — ordinal comparison.

**`events`**
```
id, slug text unique, title text, summary text, body jsonb (Tiptap), 
category text ('club_night','trip','freestyle','slalom','pool','social','course','other'),
location_name text, location_address text, location_lat numeric, location_lng numeric,
starts_at timestamptz, ends_at timestamptz, all_day boolean,
visibility visibility default 'public',
booking_enabled boolean default false, booking_opens_at, booking_closes_at,
capacity int, allow_waitlist boolean default true,
members_only_booking boolean default true,
cost_pence int default 0, cost_note text,
water_level_dependent boolean default false,
organiser_user_id references profiles,
status text ('draft','published','cancelled'),
cover_image_path text,
recurrence_rule text  -- iCal RRULE; expanded at query time for a 6-month window (v1: weekly only)
```

**`event_bookings`**
```
id, event_id, user_id, status booking_status, guests int default 0, note text,
booked_at, cancelled_at, checked_in_at
unique (event_id, user_id)
```

**`event_media`**
```
id, event_id, kind text ('image','video_embed'), storage_path text, embed_url text,
caption text, sort_order int, uploaded_by
```

**`documents`**
```
id, title text, category text ('policy','procedure','constitution','minutes','agm','form','guide','other'),
storage_path text, file_name text, mime_type text, size_bytes int,
version_label text, effective_from date, review_due date,
visibility visibility default 'members', sort_order int, uploaded_by,
superseded_by uuid references documents
```

**`pages`** (CMS)
```
id, slug text unique, title text, body jsonb, excerpt text, hero_image_path text,
visibility visibility default 'public', status ('draft','published'),
show_in_nav boolean default false, nav_parent text, nav_order int,
seo_title text, seo_description text, published_at, author_user_id
```
Reserved slugs (cannot be created via CMS): every route in §4.1–4.4.

**`posts`** (news) — same shape as `pages` minus nav fields, plus `category text` and `cover_image_path`.

**`committee_roles`**
```
id, role_title text, description text, holder_user_id references profiles nullable,
holder_display_name text, contact_email text (role alias), sort_order int, is_vacant boolean generated
```

**`notices`** — members-only short messages (gate code etc).
```
id, title, body text, visibility ('members','committee'), pinned boolean, expires_at, created_by
```

**`segments`** — saved member filters.
```
id, name text, definition jsonb (see §7 Phase 9 for schema), created_by, is_system boolean
```
System segments seeded: `Current paid members`, `Current adult members`, `Current junior members`, `Current family memberships`, `Lapsed — paid last year, not this year`, `Registered, never paid`, `Expiring in 30 days` (relevant Dec), `Committee`.

**`email_campaigns`**
```
id, subject text, preheader text, body jsonb, segment_id, segment_snapshot jsonb,
status campaign_status, scheduled_for, sent_at, sent_by, recipient_count int,
resend_batch_ids text[]
```
**`email_recipients`**
```
id, campaign_id, user_id, email text, status text ('queued','sent','delivered','bounced','complained','failed'), resend_id text, error text
```

**`audit_log`**
```
id, actor_user_id, action text, entity text, entity_id uuid, before jsonb, after jsonb, ip text
```
Written by a shared `audit()` helper in every admin server action. Never deleted by app code.

**`import_batches`** (Phase 11) — `id, source text, file_name, row_count, imported_count, skipped_count, log jsonb, run_by`.

### 5.3 Storage buckets
| Bucket | Public | Path convention | Policy |
|---|---|---|---|
| `site-images` | yes | `pages/…`, `posts/…`, `events/{event_id}/…` | committee write, anyone read |
| `avatars` | no (signed URLs) | `{user_id}.webp` | owner write, members read |
| `documents-public` | yes | `policies/…` | committee write |
| `documents-members` | no | `{category}/{id}-{filename}` | committee write, `is_current_member()` read via signed URL |

All uploads resized server-side (sharp): images max 2000px, WebP; avatars 512px.

### 5.4 RLS policy matrix (implement exactly; test each with `pnpm test:rls`)
| Table | anon | registered | member (current) | committee | admin |
|---|---|---|---|---|---|
| profiles | — | own row R/W (not role) | own R/W; others: name only via `current_members` view | all R/W except role | all R/W |
| memberships | — | own R | own R | all R/W | all R/W |
| membership_members | — | own R | own R | all R/W | all R/W |
| events | published+public R | + members visibility R | + members visibility R | all R/W | all R/W |
| event_bookings | — | own R/W (if event allows non-members) | own R/W | all R/W | all R/W |
| event_media | public event R | R | R | R/W | R/W |
| documents | public visibility R | public R | + members R | all R/W | all R/W |
| pages / posts | published public R | same | + members R | all R/W | all R/W |
| committee_roles | R (public fields) | R | R | R/W | R/W |
| notices | — | — | members R | R/W | R/W |
| segments, email_* | — | — | — | R/W | R/W |
| audit_log | — | — | — | — | R |
| import_batches | — | — | — | — | R/W |

Role changes (`profiles.role`) only via `set_user_role()` security-definer function callable by `admin`; committee can promote to `committee` only via admin. Talon Insights holds an `admin` account for the maintenance contract; the club holds at least two.

---

## 6. Authentication, roles and gating

- Supabase Auth, email + password, with magic-link as alternative on login. Email verification required before tier selection.
- Middleware (`lib/supabase/middleware.ts`) refreshes session and sets `x-user-role` / `x-is-current-member` headers for layouts. **Layouts re-check on the server**; middleware is a convenience, not the guard.
- `requireRole('committee')` and `requireCurrentMember()` helpers throw `redirect()` appropriately. Every server action and route handler calls the relevant helper first.
- Role promotion: on first `active` membership → role becomes `member` (trigger). On expiry sweep → role stays `member` but `is_current_member()` returns false; members area gates on the function, not the role. `committee`/`admin` are set manually and are never downgraded by the sweep.
- Junior accounts: a junior may have their own login; guardian name/phone mandatory. Family memberships: primary payer creates the membership; family members are added by name and optionally invited to create linked logins (`membership_members.user_id`).
- Sessions: 7-day refresh; admin routes require re-auth if session older than 24h for destructive actions (delete member, send campaign).

---

## 7. Build phases

Format per task: `ID — task. ✔ acceptance line.` Claude Code ticks the ID in `STATUS.md` only when the acceptance line is demonstrably true.

### Phase 0 — Scaffold, tokens, component sourcing, shell (owns: root config, `app/layout.tsx`, `components/ui`, `components/layout`, `docs/components.md`)
- P0-01 — Init Next.js 15 + TS strict + Tailwind v4 + pnpm; ESLint + Prettier; `CLAUDE.md`, `STATUS.md` (every task ID from this spec pre-listed, unticked), `.env.example`, `docs/design-decisions.md` (copy of §3). ✔ `pnpm build` passes on empty app.
- P0-02 — Tooling: `npx shadcn@latest init` (Tailwind v4, CSS variables); install `@21st-dev/cli`, `21st login`; add 21st MCP to Claude Code; create `docs/components.md` with the table header (Component · Source URL · Author · Licence · Score · Changes). ✔ `21st search "data table"` returns results from the terminal.
- P0-03 — Fonts via `next/font` (Bricolage Grotesque, Figtree), colour and spacing tokens in `globals.css` exactly as §3.2/3.4, Tailwind theme mapped to tokens; contrast test script `scripts/contrast.ts` asserting every pair in §3.2. ✔ Script passes; `/` renders a heading in Bricolage on `--tcc-foam`.
- P0-04 — shadcn primitives installed in one pass (list in §3.6), then tokenised **one file at a time** in this order: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Badge, Dialog, Sheet, Tabs, Tooltip, Popover, DropdownMenu, Skeleton, Toast, Avatar, Accordion, Breadcrumb, Pagination, Table. Each gets sizes sm/md/lg (36/44/52), focus ring, disabled, and appears on `/dev/ui`. ✔ Each file logged in `docs/components.md`; axe clean on `/dev/ui`.
- P0-05 — `Container`, `Section` (`tone`, `spacing`), `PageHero`, and the three section-shape layout helpers (`FullGrid`, `Split75`, `CentredColumn`) plus `useBalancedColumns`. ✔ `/dev/layout` shows each shape with 1–8 dummy items at 375/768/1280 and no row is short.
- P0-06 — Source `Header` + `MobileNav` from 21st.dev per §3.6 protocol; adapt. ✔ Decision logged; keyboard navigable; drawer traps focus; active `signal` underline.
- P0-07 — Source `Footer`. ✔ Logged; no gmail addresses; role aliases only.
- P0-08 — Source `HomeHero`. ✔ Logged; fixed `svh` heights; reveal once; reduced-motion respected.
- P0-09 — Source card block → `SportCard`, `NewsCard`, `EventCard` share one anatomy. ✔ Logged; equal heights proven on `/dev/layout` with mismatched copy.
- P0-10 — Source `PricingTiers`. P0-11 — `FaqAccordion`. P0-12 — `CommitteeGrid`. P0-13 — `EventCalendar`. P0-14 — `DatePicker`/`DateTimePicker`. P0-15 — `FileUpload`. P0-16 — `ImageGallery`. P0-17 — `DataTable`. P0-18 — `StatCard`. P0-19 — `AdminSidebar` + `BottomTabBar`. P0-20 — `EmptyState`. P0-21 — `Stepper`. P0-22 — `SignInForm`/`SignUpForm`. P0-23 — `Timeline`. Each ✔: protocol followed, decision logged, tokenised, states added, on `/dev/ui`, axe clean. (Install cap: if the daily limit is hit, port from `21st search` source and log the licence.)
- P0-24 — `DateTime` and `Money` display helpers (Europe/London, GBP). ✔ Unit tests.
- P0-25 — `not-found.tsx`, `error.tsx`, `loading.tsx` at root, styled. ✔ Branded 404 with nav.
- P0-26 — Supabase project created (London), `lib/supabase/{client,server,admin,middleware}.ts`, `pnpm supabase:types`. ✔ Types generate.
- P0-27 — Vercel project linked to GitHub, preview deploys on PR, env vars set. ✔ Preview URL renders.

**Phase 0 exit:** all above ticked; `docs/components.md` complete for every row of the §3.6 table; Lighthouse mobile ≥ 95 on `/dev/ui`; balance audit passed on `/dev/layout`.

### Phase 1 — Database schema, RLS, seed (owns: `supabase/migrations`, `supabase/seed.sql`, `lib/queries/*` skeletons)
- P1-01 — Migration: enums (§5.1). P1-02 — `profiles` + signup trigger + `updated_at` trigger. P1-03 — `membership_periods` + partial unique index + seed 2025 (past) and 2026 (current). P1-04 — `memberships`. P1-05 — `membership_members`. P1-06 — `current_members` and `membership_history` views. P1-07 — `is_current_member()`, `has_role()`, `set_user_role()`. P1-08 — `events`, `event_bookings`, `event_media`. P1-09 — `documents`. P1-10 — `pages`, `posts`. P1-11 — `committee_roles`, `notices`. P1-12 — `segments` + system seed. P1-13 — `email_campaigns`, `email_recipients`. P1-14 — `audit_log` + `audit()` SQL function. P1-15 — `import_batches`. P1-16 — storage buckets + policies.
  Each ✔: migration applies cleanly from zero; RLS enabled; policies match §5.4 row for that table.
- P1-17 — RLS test harness (`scripts/test-rls.ts`) creating four test users (registered, member, committee, admin) and asserting each cell of §5.4. ✔ All assertions pass in CI.
- P1-18 — Seed: committee roles (Chair, Secretary, Treasurer, Membership Secretary, Welfare Officer, Coaching Lead, Site/Equipment, Social — holders left vacant except Chair = Simon Wiles placeholder), 3 sample events, 2 sample posts, the 12 placeholder images registered in `site-images`. ✔ `pnpm supabase:reset` yields a browsable dataset.

### Phase 2 — Public site (owns: `app/(public)`, `components/site`)
Content comes from §10; images from §9. Build each route completely before the next, using only the three section shapes from §3.4 and the components sourced in Phase 0. Run the §3.4 alignment audit and §3.5 UX rules per route.
- P2-01 — Home hero using `HomeHero` (P0-08): full-bleed `Jackfield-high-view.jpg` under deep colour field (65% overlay), h1 "Paddle the Severn with Telford Canoe Club", one-line intro, two buttons (Join the club → `/join`, See what's on → `/events`). One orchestrated reveal. ✔ Mobile 4:5 crop keeps kayaker visible; LCP < 2.5s.
- P2-02 — Home "Three ways to paddle" — `FullGrid` of 3 `SportCard`s (image 3:2, title, 2-line summary, link). ✔ No orphan; equal heights at all widths.
- P2-03 — Home upcoming events strip (next 3 published public events; empty state "Nothing scheduled — check back or join to hear first"). ✔ Empty state keeps section height.
- P2-04 — Home latest news (3). P2-05 — Home venue strip (address, map thumbnail static image, "Find us"). P2-06 — Home join CTA band on `deep` tone with tier prices pulled from settings. ✔ Each: no layout shift on load.
- P2-07 — `/paddlesports` overview. P2-08/09/10 — the three sport pages using `PageHero` + 7/5 split sections alternating, migrated copy. ✔ Old URLs 301 to new (`next.config` redirects list in P12).
- P2-11 — `/about` with history section. P2-12 — `/about/committee` from `committee_roles` (vacant roles shown as "Vacant — could this be you?" linking to role descriptions). P2-13 — `/about/role-descriptions` (CMS page). P2-14 — `/about/policies` (public documents list). P2-15 — `/about/privacy` (CMS page with retention statement).
- P2-16 — `/venue`: address, embedded map (static image + link to Google Maps; no third-party script), parking notes, EA river-level link for Ironbridge gauge, "members see gate code after login" note. ✔ No cookies set by this page.
- P2-17 — `/events` list (cards) + month grid toggle (client component), category filter, past tab. P2-18 — `/events/[slug]` detail with media gallery, `.ics` button, booking CTA state machine (not open / open / full → waitlist / closed / members only → login / cancelled). ✔ All six states render.
- P2-19 — `/news` + `/news/[slug]` with Tiptap renderer. P2-20 — `/join` with tier cards (Adult £25 / Junior £15 / Family £40, "Runs to 31 December"), what's included, FAQ accordion, CTA to `/register`. P2-21 — `/contact` form → Resend to `EMAIL_COMMITTEE`, honeypot, 5/min rate limit, success state. P2-22 — `/[slug]` generic CMS page route with reserved-slug guard.
- P2-23 — Metadata: per-page `generateMetadata`, OpenGraph image (branded default), `sitemap.ts`, `robots.ts`. ✔ Rich preview validates.

**Phase 2 exit:** every public route renders with real content, no console errors, Lighthouse mobile ≥ 90 all categories, axe clean.

### Phase 3 — Auth and onboarding (owns: `app/(auth)`, `lib/auth`)
- P3-01 — Register form (first/last name, email, password, DOB, phone, address, postcode, BC number optional, guardian fields if DOB < 18, consent checkboxes: rules + risk acknowledgement + privacy). Zod schema shared. ✔ Junior path requires guardian.
- P3-02 — Email verification page + resend. P3-03 — Login (password + magic link). P3-04 — Forgot/reset. P3-05 — `/welcome`: choose tier → hands off to Phase 4 Checkout; family tier shows "add family members" names step first. ✔ Abandoning mid-flow leaves account in `registered` with no membership row.
- P3-06 — `requireRole`, `requireCurrentMember`, middleware, layouts for `(members)` and `(admin)`. ✔ Direct URL access to gated routes redirects correctly for all four roles (add to RLS harness as e2e).

### Phase 4 — Membership and payments (owns: `lib/paypal.ts`, `api/paypal/webhook`, membership server actions, `/members/membership`, admin "mark paid")
- P4-01 — PayPal: confirm the business account is owned by the club (D1). Create a REST app in the PayPal developer dashboard (sandbox + live), register webhook URL, store IDs in env. `lib/paypal.ts`: OAuth token (cached), `createOrder(tier, period, userId, familyNames)` — amount from admin settings, `custom_id = "{user_id}|{tier}|{period_id}"`, `invoice_id = "TCC-{period}-{short user id}"` (prevents accidental duplicate payment), `capture_order(orderId)`, `verifyWebhookSignature(headers, body)`. ✔ Sandbox order creates and captures from a script.
- P4-02 — `/welcome` tier step renders PayPal Buttons (`@paypal/react-paypal-js`, `client-id` public, GBP, no funding sources hidden; card-without-account enabled). `createOrder` and `onApprove` call server actions; `onApprove` captures server-side and, on `COMPLETED`, inserts `memberships` (`active`, `source=paypal`, `paypal_order_id`, `paypal_capture_id`, `paid_at`) + `membership_members` rows, promotes role, writes audit. Redirect to `/members/membership?order=`. ✔ Test-mode purchase lands on success with an active badge.
- P4-03 — Webhook `/api/paypal/webhook`: verify signature via PayPal verify-webhook-signature API; handle `PAYMENT.CAPTURE.COMPLETED` (create membership if P4-02 didn't — idempotent on `paypal_capture_id`), `PAYMENT.CAPTURE.REFUNDED` (set `refunded`, audit), `PAYMENT.CAPTURE.DENIED` / `PENDING` (set `pending`, notify committee). Webhook is the reconciliation path; on-approve capture is the fast path. ✔ Replaying an event does not duplicate; a browser closed mid-capture still results in an active membership via webhook.
- P4-04 — Notifications on activation: email to member (receipt with PayPal capture ID + "what's next" + members-area link) and to `EMAIL_COMMITTEE` (name, tier, amount). ✔ Both arrive in Resend test.
- P4-05 — `/members/membership` page: status card (Active until 31 Dec 2026 / Not active / Expires in N days / Payment pending), renew button (only when a next period exists and current ends within 60 days or has ended), history table, family members list, PayPal transaction reference. ✔ All states.
- P4-06 — Admin "Record payment" dialog on member record: tier, period, source (bank/cash/complimentary), amount, reference, note → creates `active` membership + audit + same notifications. ✔ Audit row written; member gets email.
- P4-07 — Admin actions: cancel membership (reason), mark refunded (note only — refunds issued in the PayPal dashboard; webhook then confirms), extend/complimentary. ✔ Each writes audit.
- P4-08 — Cron `expiry-sweep` (daily 02:00 UK): set `expired` on memberships whose period ended; on 1 Jan flip `is_current`. Cron `renewal-reminders`: 1 Dec, 15 Dec, 2 Jan to members with no active next-period membership. ✔ Dry-run flag logs instead of sends.
- P4-09 — `docs/payments.md`: how the flow works, the Treasurer's refund procedure in PayPal, what "pending" means (eCheque / risk review) and what to do, how to change prices in admin settings, how to rotate PayPal credentials.

**Phase 4 exit:** end-to-end sandbox purchase → member appears in `current_members` → can access `/members` → committee sees them in admin → committee-recorded bank payment behaves identically → refund in PayPal sandbox flips status via webhook.

### Phase 5 — Events and bookings (owns: admin events, booking actions, calendar feeds)
- P5-01 — Admin event list (upcoming/past/draft tabs). P5-02 — Event form (all fields §5.2, Tiptap body, cover upload, recurrence weekly toggle with end date, booking settings). ✔ Draft/publish/cancel transitions with audit.
- P5-03 — Media manager: image upload (multi, sorted), video embed by URL (YouTube/Vimeo validated, rendered lite-embed with click-to-load, no cookies until click). ✔ Reorder persists.
- P5-04 — Booking server action: capacity check in a transaction, waitlist promotion on cancel, guest count, members-only enforcement. ✔ Concurrency test: 5 simultaneous bookings on capacity 3 yields 3 booked + 2 waitlist.
- P5-05 — Booking emails: confirmation, waitlist, promoted, cancelled by club. P5-06 — `/members/events` my bookings. P5-07 — Admin bookings tab per event: list, check-in toggle, CSV export, "email attendees" (creates a campaign with an ad-hoc segment). P5-08 — `.ics` per event + public feed + per-member token feed. ✔ Feed subscribes in Apple/Google Calendar.

### Phase 6 — Document library (owns: admin documents, `/about/policies`, `/members/documents`)
- P6-01 — Admin upload (PDF/DOCX/XLSX, 20MB), category, visibility, version label, effective/review dates. P6-02 — Supersede flow (new version links old). P6-03 — Public policies page grouped by category with file size and date. P6-04 — Members library with search + category chips, signed URLs (1h). P6-05 — Review-due dashboard widget for committee. ✔ Members-only file URL fails for anon even when guessed.

### Phase 7 — Committee CMS: pages and news (owns: `components/editor`, admin pages/news)
- P7-01 — Tiptap editor wrapper: headings h2–h4, paragraphs, bold/italic, lists, links, image (upload to `site-images`), blockquote, callout (info/warning), embed (video URL), horizontal rule, table. Toolbar is touch-friendly. ✔ Works on iPhone Safari.
- P7-02 — Server renderer (Tiptap JSON → sanitised HTML) with the site's prose styles. P7-03 — Pages CRUD with slug generator, reserved-slug guard, nav placement (parent + order), visibility, SEO fields, live preview. P7-04 — News CRUD with cover + category + scheduled publish. P7-05 — Nav is built from `pages` where `show_in_nav` merged with fixed routes; cached and revalidated on save. ✔ Committee can create "New event at X on Y" page with photos and a booking link in under 3 minutes, no developer.

### Phase 8 — Members area (owns: `app/(members)` remaining routes)
- P8-01 — Dashboard cards (membership, next 3 events, my bookings, notices, documents). P8-02 — Notices page + admin notice CRUD (pinned, expiry). P8-03 — Profile edit (with BC number, emergency contact, email preferences), avatar crop/upload. P8-04 — Mobile bottom tab bar. ✔ Unpaid registered user sees only the membership page.

### Phase 9 — Admin: members directory and segments (owns: `/admin`, `/admin/members*`, `/admin/settings`, `/admin/committee`)
- P9-01 — Overview dashboard (counts by tier, expiring, unpaid registrations, recent payments, next events, docs due review). ✔ Loads < 1s at 500 members.
- P9-02 — Members table (`DataTable`, P0-17): columns name, email, tier, status, period, junior, BC no., joined, last paid; sort; search; sticky first column. P9-03 — Filter builder. Segment definition JSON schema:
  ```json
  { "all": [
    { "field": "membership.status", "op": "eq", "value": "active", "period": "current" },
    { "field": "profile.is_junior", "op": "eq", "value": false },
    { "field": "membership.tier", "op": "in", "value": ["adult","family"] },
    { "field": "membership.status", "op": "eq", "value": "active", "period": "previous" },
    { "field": "membership.status", "op": "eq", "value": "none", "period": "current" }
  ] }
  ```
  Server translates to SQL against `membership_history`. ✔ Every system segment in §5.2 reproduces via the builder.
- P9-04 — Save segment, load segment, count preview. P9-05 — Bulk actions: select all matching → "Email these members" (→ Phase 10 campaign prefilled), "Export CSV", "Add note". P9-06 — Member record page with tabs (Profile, Membership, Bookings, Emails, Notes, Actions). P9-07 — Manual "Add member" (committee creates account + optional invite). P9-08 — Settings page. P9-09 — Committee roles admin. P9-10 — Audit log viewer. ✔ David's three examples each ≤ 3 clicks from `/admin` — record the click path in `docs/admin-guide.md`.

### Phase 10 — Email (owns: `lib/email`, `/admin/email*`)
- P10-01 — Resend domain verified (SPF, DKIM, DMARC records documented in `docs/dns.md`). Transactional templates (react-email): verify, reset, welcome, receipt, committee-notification, booking ×4, renewal ×3, notice. ✔ Render in Gmail/Outlook/iOS.
- P10-02 — Campaign composer: subject, preheader, Tiptap body, segment picker (or ad-hoc from members table), personalisation tokens `{{first_name}}`, preview, send test to self. P10-03 — Send: snapshot recipients into `email_recipients`, batch via Resend (100/batch), status polling via Resend webhooks (`delivered`, `bounced`, `complained`). P10-04 — Suppression: bounced/complained addresses excluded from future campaigns, flagged on member record. P10-05 — Campaign report page. P10-06 — Unsubscribe link for non-transactional (sets `email_opt_in=false`; transactional unaffected). ✔ "Email this new gate code to all paid-up members" = New campaign → segment "Current paid members" → compose → send: 3 clicks + typing.

### Phase 11 — Migration from ARMember (owns: `scripts/import-armember.ts`, `/admin/members/import`)
Requires the WordPress DB export (`wp_users`, `wp_usermeta`, `arm_members`, `arm_subscription_plans`, `arm_membership_setup`, `arm_payment_log`) or a CSV export from ARMember admin. Also the events plugin bookings if available.
- P11-01 — Mapping doc `docs/migration-mapping.md` (ARMember field → `profiles`/`memberships` column, tier name → enum, plan expiry → period). P11-02 — Dry-run importer: parses, reports counts, duplicates, malformed emails, unknown tiers; writes `import_batches` log. P11-03 — Real import: creates auth users **without passwords**, `profiles` with `legacy_arm_user_id`, memberships for each historical paid year found in payment log (`source=imported`), current-year ones `active` if paid in 2026. P11-04 — Invite flow: campaign "Set up your new members' account" with magic link; unverified accounts shown as "Invited" in admin. P11-05 — Reconciliation screen: committee confirms/edits status per imported person before invites go out. ✔ Simon can answer "who is a current paid member" from the reconciliation screen before launch.

### Phase 12 — Quality, SEO, redirects, accessibility, performance
- P12-01 — Redirect map from every old URL in §10.4 (`next.config.ts`). P12-02 — Remove `/dev/ui` and `/dev/layout`. P12-03 — axe + Lighthouse pass on every route at 375 and 1280. P12-04 — Image audit: all `<Image>` with sizes, priority on LCP only. P12-05 — Security headers (CSP, HSTS, frame-ancestors), rate limiting on auth + contact + booking. P12-06 — Error monitoring wired. P12-07 — Backups: Supabase PITR confirmed; weekly logical dump to club-owned storage documented. ✔ Checklist in `docs/launch-checklist.md` fully ticked.

### Phase 13 — Launch and handover
- P13-01 — Club-owned accounts: Vercel team, Supabase org, PayPal (Treasurer), Resend, registrar — Talon Insights as collaborator, not owner. P13-02 — DNS cutover plan with old-server freeze date. P13-03 — Admin guide (`docs/admin-guide.md`, screenshots, the three David examples, refund procedure, how to add a committee member, what to do on 1 Jan). P13-04 — 30-minute committee walkthrough recorded. P13-05 — Maintenance contract scope (see §12). ✔ Simon and one other committee member can each log in as `admin` and complete every admin-guide task.

### Phase 14 — Optional v2: read-only "Ask" assistant
Not in launch scope. If commissioned: Anthropic API server-side, tools limited to `run_segment(definition)`, `count_members`, `list_events`, `draft_email(subject, body)`; no write tools; every answer shows the underlying filter so the committee learns the structured route. Rate-limited per user, logged to audit.

---

## 8. Permissions matrix (feature level — must agree with §5.4)

| Capability | Registered | Member | Committee | Admin |
|---|---|---|---|---|
| View public site | ✔ | ✔ | ✔ | ✔ |
| Buy/renew membership | ✔ | ✔ | ✔ | ✔ |
| Members area, notices, members documents | — | ✔ | ✔ | ✔ |
| Book members-only events | — | ✔ | ✔ | ✔ |
| Book open events | ✔ (if event allows) | ✔ | ✔ | ✔ |
| Create/edit pages, news, events, documents, notices | — | — | ✔ | ✔ |
| View member directory, filters, export | — | — | ✔ | ✔ |
| Record manual payment, cancel membership | — | — | ✔ | ✔ |
| Send campaigns | — | — | ✔ | ✔ |
| Run importer | — | — | — | ✔ |
| Change roles, view audit log, settings | — | — | — | ✔ |

---

## 9. Placeholder image map (pulled from current site — temporary until Simon supplies new assets)

Download in Phase 1 (P1-18) to `public/images/placeholders/` and upload to `site-images/placeholders/`. All from `https://telfordcanoeclub.co.uk/wp-content/uploads/`. Rename as shown. Check dimensions on download; anything under 1200px wide is flagged `LOW-RES` in `STATUS.md` for replacement.

| # | Source file | New name | Use |
|---|---|---|---|
| 1 | `2024/01/Jackfield-high-view.jpg` | `hero-jackfield.jpg` | Home hero, `/venue` hero |
| 2 | `2024/01/TCC-cover-photos-1.jpg` | `cover-01.jpg` | `/paddlesports` hero |
| 3 | `2024/01/TCC-cover-photos-2.jpg` | `cover-02.jpg` | `/about` hero |
| 4 | `2024/01/TCC-cover-photos-3.jpg` | `cover-03.jpg` | `/events` hero |
| 5 | `2024/01/TCC-cover-photos-4.jpg` | `cover-04.jpg` | `/join` hero, OG default |
| 6 | `2024/01/Telford-White-Water-Kayaking.jpg` | `ww-norway-waterfall.jpg` | Whitewater card + page split 1 (caption: member running a waterfall in Norway) |
| 7 | `2024/01/Telford-whitewater-kayaking-2-1024x683.jpg` | `ww-dee-wave.jpg` | Whitewater page split 2 (River Dee). LOW-RES likely — request original |
| 8 | `2024/01/HPP-Worlds-Practice-22-1024x576.jpg` | `fs-hpp-air.jpg` | Freestyle card + split 1 (credit: Simon Wyndham). LOW-RES likely |
| 9 | `2024/01/368005219_…_n-1024x683.jpg` | `fs-fairy-wave.jpg` | Freestyle split 2 (Fairy Wave, HPP). LOW-RES likely |
| 10 | `2024/01/Telford-Paddleboarding-hero-image-1024x436.jpg` | `sup-hero.jpg` | SUP card + split 1. Wide crop — use 3:2 centre crop for card |
| 11 | `2024/01/Telford-Paddleboarding-1024x436.jpg` | `sup-canal.jpg` | SUP split 2 |
| 12 | `2025/08/TCC-Matt-Stephenson-2025-11.jpg` (request full-size; only 150px thumb linked) | `news-freestyle-2025.jpg` | Seed news post cover |

Missing and needed from Simon: club logo (SVG), committee headshots, a photo of the Jackfield site/car park/containers, pool session photo, a social/BBQ photo. Until supplied, committee cards use initials avatars and the venue page uses image 1.

---

## 10. Content migration inventory

### 10.1 Copy to migrate verbatim (then lightly edit for sentence case and length)
- **Whitewater Kayaking** — full page copy (3 paragraphs + intro), two captions.
- **Freestyle Kayaking** — full page copy (5 paragraphs), two captions, mention of GB team workshops and Burners events.
- **SUP** — full page copy (3 paragraphs), two captions.
- **About** — two intro paragraphs + "Where will your paddlesports journey take you?" + history section (1960s hut below the Black Swan, Dale End park, 1987 lease at Jackfield, army reserves built roads/parking/toilets/containers, 40 national slaloms, 15 river races, New Town Games).
- **News posts** to seed: "Paddle UK club membership" (23 May 2026, Simon Wiles — JustGo profile update request), "TCC committee" (18 Apr 2026 — committee viability, thanks to Iain), "Freestyle coaching at Jackfield with Matt Stephenson" (9 Aug 2025, Simon Wyndham).
- **Membership tiers and rules text** from signup: tier names/prices/expiry; rules & constitution acceptance; risk acknowledgement; junior parental consent wording.
- **Club address:** Jackfield Rapids, The Lloyds, Jackfield, Ironbridge, Telford, TF8 7HJ.
- **Event categories in use:** Freestyle, Slalom, Kayaking, Pool Sessions, Club Evening Paddles (water levels dependent, 5:30–9pm summer).

### 10.2 Copy to write new (Talon, before Phase 2)
Home hero line and intro; `/paddlesports` overview intro; `/venue` parking and access text (public-safe); `/join` "what's included" and FAQ (licence/Paddle UK relationship, juniors, family definition, what happens 31 Dec, cash payment option); contact page intro; 404 copy; email templates.

### 10.3 Content the club must supply (add to §11)
Policies and procedures PDFs; constitution; committee names and roles; role descriptions text; AGM and committee meeting minutes (if to be published); privacy policy update approval; gate code and any members-only notices; logo; photos.

### 10.4 Old → new redirects (301)
```
/paddlesports/standup-paddleboard-sup/  → /paddlesports/paddleboarding
/about/committee/                        → /about/committee
/about/committee-meetings/               → /members/documents?category=minutes
/about/agm/                              → /members/documents?category=agm
/club-role-descriptions/                 → /about/role-descriptions
/about/tcc-policies/                     → /about/policies
/about/privacy-policy/                   → /about/privacy
/latest-news/                            → /news
/events/locations/ /events/categories/ /events/tags/ → /events
/events/my-bookings/                     → /members/events
/membership/                             → /join
/membership/20-2/                        → /register
/membership/login/                       → /login
/register/                               → /register
/membership/forgot_password/             → /forgot-password
/membership/edit_profile/                → /members/profile
/category/*                              → /news
/paddle-uk-club-membership/              → /news/paddle-uk-club-membership
/tcc-committee/                          → /news/tcc-committee
/freestyle-coaching-at-jackfield-with-matt-stephenson/ → /news/freestyle-coaching-jackfield-matt-stephenson
/events/[old-slug]/                      → /events (catch-all; individual past events not migrated unless export available)
```

---

## 11. Client decisions and dependencies log

| # | Item | Owner | Needed before | Status |
|---|---|---|---|---|
| D1 | Confirm the PayPal business account is owned by the club (not the previous chair); Treasurer has login; can create REST app credentials | Simon/Treasurer | Phase 4 | Open — risk |
| D2 | Confirm tiers and prices for 2027 (unchanged?) and whether pro-rata for late joiners | Committee | Phase 4 | Open |
| D3 | Cash/bank transfer still accepted? (drives manual path prominence on `/join`) | Committee | Phase 2 | Open |
| D4 | WordPress DB export or ARMember CSV from previous chair's server | Simon | Phase 11 | Open — risk |
| D5 | Registrar login for telfordcanoeclub.co.uk; DNS access for Resend + Vercel | Simon | Phase 10 | Open — risk |
| D6 | Club email aliases (`hello@`, `committee@`, `membership@`, `tech@`) — where hosted | Committee | Phase 10 | Open |
| D7 | Data retention: confirm 5 years for lapsed members; privacy policy wording sign-off | Committee | Phase 12 | Open |
| D8 | Family membership definition (same address; max people?) | Committee | Phase 4 | Open |
| D9 | Junior: can under-18s hold their own login, or guardian-only accounts? Spec assumes own login with guardian details | Welfare Officer | Phase 3 | Open |
| D10 | Which policies/minutes are public vs members-only | Committee | Phase 6 | Open |
| D11 | Logo and photography | Simon | Phase 2 (can launch on placeholders) | Open |
| D12 | Old-server freeze date and cutover weekend | Simon | Phase 13 | Open |
| D13 | Maintenance contract terms (§12) | Simon/Talon | Phase 13 | Open |
| D14 | Ask assistant (Phase 14) — in or out of scope, and budget | Committee | Post-launch | Open |

---

## 12. Maintenance contract — scope to propose

Monthly retainer covering: hosting and platform bills passed through at cost (Vercel Hobby/Pro, Supabase Pro, Resend; PayPal fees excluded), dependency and security updates monthly, uptime monitoring, 1 Jan rollover check, backup verification quarterly, up to N hours/month of content or feature changes, 2-working-day response for defects, priority list for the committee. Talon Insights retains an `admin` login and Vercel/Supabase collaborator access; club owns all accounts, code repository and data. Exit clause: full handover pack on termination.

---

## 13. Definition of done (whole project)

1. Every task ID in `STATUS.md` ticked; no `BLOCKED` items remaining except Phase 14.
2. A new visitor can read about the club, see events, and join via PayPal (or card via PayPal guest checkout) in under 5 minutes on a phone.
3. Simon can, from his phone: list current paid adult members, email the gate code to all paid-up members, create an event page with photos and booking, upload a policy, mark a bank-transfer payment as paid — each in ≤ 3 clicks plus typing, without contacting Talon.
4. No member data is reachable without the correct role (RLS harness green).
5. Old URLs redirect; Lighthouse ≥ 90 mobile on all public routes; axe clean.
6. Club owns every account; handover pack delivered; maintenance contract signed.
7. `docs/components.md` lists every component with source and licence; `docs/design-decisions.md` matches §3; every page passes the §3.4 balance audit at 375px and 1280px.

*End of specification v2.0.*
