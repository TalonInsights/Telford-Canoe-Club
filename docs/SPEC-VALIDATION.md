# TCC Build Spec v2.0 — pre-flight validation

Run: 31 August 2026, by Claude Code before Phase 0. Everything testable in the
spec was tested: the design arithmetic, every external dependency, the local
toolchain, and the data model as written. Method: scripted WCAG contrast
computation, live HTTP checks against the old site / Google Fonts / 21st.dev /
npm registry / EA API, image download + pixel measurement, and a live 21st.dev
MCP search.

**Verdict: the spec is buildable.** 60+ checks pass. Five defects need a spec
correction before the phase that touches them (none blocks Phase 0), and three
local tools need installing.

---

## 1. Defects — spec corrections needed

### 1.1 §4.1 `/venue` — the EA "Ironbridge" gauge is the wrong river ⚠️
The EA flood-monitoring station named "Ironbridge" (notation `067027_TG_127`)
is on the **River Dee at Aldford, Cheshire** — not the Severn. Linking it would
give paddlers a water level for a river 50 miles away. The correct gauge for
Jackfield is **Buildwas** (River Severn, station `2134`, just upstream of
Ironbridge). Verified live:
`https://check-for-flooding.service.gov.uk/station/2134` → 200.
**Fix:** use the Buildwas link on `/venue`. Needed by P2-16.

### 1.2 §5.2 `profiles.is_junior` generated column is invalid SQL
Postgres stored generated columns require **immutable** expressions; `now()` is
volatile, so `is_junior … = date_of_birth > (now() - interval '18 years')`
fails to migrate — and even if it didn't, it would be computed at write time
and go stale as members age. **Fix:** drop the generated column; compute
juniorness in the `current_members` / `membership_history` views and an
`is_junior(date_of_birth)` SQL function using `current_date`. Needed by P1-02.

### 1.3 §5.2 `membership_members` key mixes types
`coalesce(user_id, display_name)` compares `uuid` with `text` — the expression
index needs a cast: `coalesce(user_id::text, display_name)`. Also give the
table its own `id uuid pk` (the spec's global rule already says every table has
one) and keep the expression as a unique index only. Needed by P1-05.

### 1.4 §5.4 members can't see other members' names as specced
The profiles RLS row gives a member access to their **own** row only, and
`current_members` is declared `security invoker` — so the view inherits that
restriction and returns only the viewer themself. The matrix cell "others: name
only via current_members view" is unimplementable as written. **Fix:** either a
narrow additional RLS policy (members may select `first_name`,`last_name` of
users appearing in an active current-period membership — via a
security-definer helper in the policy), or make the view a security-definer
function returning only the safe columns. Decide at P1-06/P1-17; the RLS
harness must assert whichever is chosen.

### 1.5 §3.2 `signal-soft` badge fails AA
Measured `#C93518` text on `#FBE8E4`: **4.43:1** (spec claims 4.6:1; AA needs
4.5:1 — badges are 13px "micro" text, so the normal-text threshold applies).
**Fix:** lighten the tint to `#FCEEEB` → measured **4.64:1**, passes. Every
other §3.2 pair passes exactly as claimed (all ten measured within ±0.04 of the
spec's numbers, including both "rejected because it failed" values — the spec's
arithmetic is honest).

---

## 2. Corrections to §9 image map (all good news)

All 11 non-elided source files download fine (200). Measured dimensions:

| Spec name | Spec source | Measured | Action |
|---|---|---|---|
| hero-jackfield | Jackfield-high-view.jpg | 1900×600 | OK for heroes; only 600px tall — fine at 72svh on laptops, request original from Simon for very tall screens |
| cover-01..04 | TCC-cover-photos-1..4.jpg | 1900×600 each | Same note |
| ww-norway-waterfall | Telford-White-Water-Kayaking.jpg | 1400×596 | OK |
| ww-dee-wave | …kayaking-2**-1024x683**.jpg | 1024×683 LOW-RES | **Full-size exists**: `Telford-whitewater-kayaking-2.jpg` (214KB) — use it |
| fs-hpp-air | HPP-Worlds-Practice-22**-1024x576**.jpg | 1024×576 LOW-RES | **Full-size exists**: `HPP-Worlds-Practice-22.jpg` (310KB) — use it |
| fs-fairy-wave | `368005219_…_n-1024x683.jpg` (elided in spec) | — | **Resolved from the live freestyle page**: `368005219_10159054193476682_7752194462433283224_n.jpg` — full-size (1MB) and a 1536×1025 variant both exist |
| sup-hero | Telford-Paddleboarding-hero-image**-1024x436**.jpg | 1024×436 LOW-RES | **Full-size exists** un-suffixed (163KB) — use it |
| sup-canal | Telford-Paddleboarding**-1024x436**.jpg | 1024×436 LOW-RES | **Full-size exists** un-suffixed (149KB) — use it |
| news-freestyle-2025 | TCC-Matt-Stephenson-2025-11.jpg | **2056×1371** | Spec's "only 150px thumb linked" caveat is wrong — the full-size is at the spec's own URL. No request to Simon needed |

Rule of thumb confirmed: strip WordPress's `-WxH` suffix to get the original.
P1-18 should download the un-suffixed originals throughout.

## 3. §10.4 redirect map — every source URL verified live

All 23 tested old-site URLs respond as expected (200, or ARMember 302→login
for `/membership/` and `/membership/edit_profile/`, which confirms those are
auth-gated pages and their new targets are right). The three news-post slugs,
all `/about/*` pages, `/club-role-descriptions/`, `/register/`,
`/membership/20-2/`, `/latest-news/`, `/events/my-bookings/` and all four sport
pages exist. The old site is up and the copy in §10.1 is retrievable. One
gap: old-site tier prices are rendered client-side by ARMember so they couldn't
be scraped for confirmation — prices rest on the client's word (fine; D2 covers
2027 anyway).

## 4. Component sourcing pipeline — verified live

- All **20 category URLs** in the §3.6 sourcing map (`/community/components/s/…`)
  return 200: navbar, navigation-menu, footer, hero, card, pricing, faq, team,
  calendar, date-picker, file-upload, gallery, table, stat, sidebar,
  empty-state, stepper, sign-in, sign-up, timeline.
- **Live 21st.dev search works** (P0-02's acceptance test, run via the 21st MCP
  already connected to Claude Code): `search "data table"` returned 5 real
  candidates including shadcn's TanStack Data Table and originui's table, each
  with an install command. Note: install commands require `API_KEY_21ST`.
- **Google Fonts**: Bricolage Grotesque (opsz 12–96, wght 200–800) and Figtree
  (300–900) both serve from the css2 API — self-hosting via `next/font` will
  work.

## 5. npm dependencies — all exist; one version decision needed

Every package the spec names is on the registry (latest at validation time):
`@21st-dev/cli` 1.16.1 · `@paypal/react-paypal-js` 10.4.0 · `ics` 3.12.0 ·
`resend` 6.25.0 · `@react-email/components` 1.0.12 · `@tiptap/react` 3.30.5 ·
`sonner` 2.0.8 · `embla-carousel-react` 8.6.0 · `react-day-picker` 10.0.1 ·
`@tanstack/react-table` 9.2.4 · `sharp` 0.35.4 · `zod` 4.5.4 ·
`react-hook-form` 7.87.0 · `lucide-react` 1.37.0 · `tailwindcss` 4.3.3 ✓v4 ·
`framer-motion` 13.1.1 · `date-fns` 4.4.0 · `@supabase/supabase-js` 2.112.4 ·
`@supabase/ssr` 0.12.5 · `shadcn` 4.19.0.

**Decision for Talon before P0-01:** the spec pins **Next.js 15**, but latest
is **16.3.3**. Starting a new build on the previous major means upgrading
mid-contract or shipping behind. Recommendation: build on 16 and amend §2.1;
logged as a question per §0 rule 9.

## 6. Design arithmetic (§3.3/§3.4)

- Container: 12×78 + 11×24 = **1200** ✓ exactly as claimed.
- Split 7/5: 7/12 = 58.3% ✓; but the 7-column text cell is **690px**, not the
  claimed ≈660px, and 68ch of 16px Figtree is ≈560–600px — so rule ⑤ of the
  §3.4 audit ("no text block wider than 68ch") requires an inner
  `max-width: 68ch` on the text side of every split. Implementation note, not a
  blocker.
- Type scale: a true 1.25 progression from 16px is 20 / 25 / 31.25 / 39.06; the
  spec's 18 / 22 / 32 / 44 is a hand-tuned approximation. The chosen values are
  good — the "major-third" label in §3.3 is just loose. No change.

## 7. Local toolchain

| Tool | Status | Action before Phase 0 |
|---|---|---|
| Node | v22.14.0 ✓ | — |
| git | 2.52.0 ✓ | — |
| corepack | 0.31.0 ✓ | run `corepack enable pnpm` |
| pnpm | **missing** | ← above one-liner |
| supabase CLI | **missing** | install (scoop/winget or npm) before P0-26/P1 |
| vercel CLI | **missing** | optional (dashboard covers it); install if wanted |
| 21st MCP | connected ✓ | already answering searches |

## 8. Untestable now (blocked on §11 client decisions)

- PayPal sandbox order flow — needs REST app credentials (D1, open risk).
- Resend domain verification — needs DNS access (D5) and alias hosting (D6).
- ARMember data shape — needs the WordPress DB export (D4, open risk).
- Vercel/Supabase club-owned accounts (P13-01) — currently the repo deploys on
  Talon's Vercel (`telford-canoe-club.vercel.app`), which is fine for build
  phases; ownership transfer is a launch task.

## 9. Minor implementation notes logged while reviewing §5–§6

1. Vercel cron runs in UTC: "02:00 UK" = schedule 02:00 UTC (correct in winter,
   03:00 BST in summer — acceptable; the critical 1 Jan flip happens in GMT).
2. `profiles.email` mirrored from auth needs a sync trigger on auth email
   change, not just on signup.
3. Nothing stops one person being named on two family memberships in the same
   period — harmless, but the reconciliation screen (P11-05) should surface it.
4. `audit_log` has no insert policy for any role — inserts must go through the
   security-definer `audit()` function; that's consistent with §5.4 but worth
   stating in the P1-14 migration comment.
5. `events.category` and `pages.status` are free text while §5.1 uses enums
   elsewhere — consider enums for consistency (non-blocking).

---

*Raw results (JSON) from the validation run are in the session scratchpad;
the contrast script becomes `scripts/contrast.ts` in P0-03 and must include
the corrected `signal-soft` value from §1.5.*
