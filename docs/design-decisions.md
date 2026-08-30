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

## Corrections applied in this build (see docs/SPEC-VALIDATION.md and STATUS.md "Decisions taken")

1. `--tcc-signal-soft` is **`#FCEEEB`** (measured 4.64:1 with `signal` text; the spec's `#FBE8E4` measured 4.43:1 and fails AA).
2. Split 7/5 text cells carry an inner `max-width: 68ch` (the 7-column cell is 690px, wider than the 68ch audit rule allows).
3. The §3.3 scale values (18/22/32/44) are kept as written; they are a hand-tuned approximation of the named 1.25 ratio, not an exact progression.
