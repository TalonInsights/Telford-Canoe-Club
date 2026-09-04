# Design refresh plan — brand mark, chrome and page rhythm

Client order (4 Sep 2026): the club badge (circular mark — Iron Bridge arch, a
paddler on the rapid, "Telford Canoe Club" round the ring) is the brand; Talon
has *"complete creative freedom … to improve the website where it sees it
possible, keeping pages symmetrical where possible and ensuring every page
follows the same theme."*

The §3 system stays exactly as specified — tokens, type, the three section
shapes, the two spacing values, sentence case, lucide only, no scroll motion.
Everything below adds brand and rhythm *inside* that frame; nothing widens it.

## What the audit found (live site, 4 Sep)

1. **No brand mark.** Header, footer, sheet, rail and 404 carry a generic paddle
   glyph and plain text; the tab icon is still the framework default.
2. **Inner heroes are muddy.** A flat 65 % deep wash over every photo flattens
   it; image-less heroes are an empty deep block.
3. **Deep call-to-action bands are bare and inconsistent** — six pages each
   hand-roll "title + two buttons" with slightly different copy patterns.
4. **Icon feature cards are hand-rolled five times** (home ×2, venue, join,
   members) with the same markup and no shared component.
5. **Auth pages** are a lone card floating on foam — no brand, no reassurance.
6. **Breadcrumbs** (§3.5 rule 5) are missing on every page below the top level.
7. **The home hero's right two-thirds is empty** on desktop.

## Tasks (DR-xx — each committed on its own)

- **DR-01 Brand mark** — `components/site/brand.tsx`: `ClubBadge` (SVG badge
  drawn from the logo: ring, deck, lattice arch, paddler, water; `detailed`
  adds the ring lettering) and `BridgeArch` (wide line-art arch for deep
  backgrounds). Both `currentColor`, so tokens recolour them. The club's raster
  artwork drops into `public/brand/` and replaces the SVG in one import when it
  arrives. Acceptance: badge legible at 32 px, ring text legible at 120 px.
- **DR-02 Icons + share image** — `app/icon.svg` (replaces the framework
  favicon), `app/apple-icon.tsx`, `app/opengraph-image.tsx` (deep field, arch,
  badge, wordmark); `metadataBase` from `NEXT_PUBLIC_SITE_URL`.
- **DR-03 Header** — badge + stacked wordmark ("Telford Canoe Club" /
  "Jackfield Rapids · Ironbridge"), hairline under the bar; sheet header to
  match. No nav or CTA changes.
- **DR-04 Footer** — badge column with one-line description, arch motif in the
  deep field, otherwise unchanged links.
- **DR-05 Section decor + CtaBand** — `Section` gains `decor="arch"` (deep tone
  only) and an optional sentence-case `kicker`. New `CtaBand` (title, intro,
  primary + secondary action) on a balanced 7/5 grid replaces the six ad-hoc
  deep bands (home, about, venue, join, paddlesports, sport pages).
- **DR-06 PageHero** — gradient overlay (deep 95 % at the text foot → 25 % at
  the top) instead of the flat wash; image-less heroes get the arch motif;
  `crumbs` prop renders a breadcrumb trail and every page below the top level
  passes one.
- **DR-07 Auth shell** — two-column at ≥ 1024 px: deep brand panel (badge,
  "Your own stretch of the Severn", three membership facts) + the existing form
  cards; a slim brand strip above the form on mobile. Covers login, register,
  welcome, forgot, reset, verify.
- **DR-08 FeatureCard** — icon tile + title + body (+ `step` number variant);
  replaces the five hand-rolled versions.
- **DR-09 Home hero** — badge watermark on the empty right side at ≥ 1024 px.
- **DR-10 Shell touches** — admin rail title, checkout header, 404 and error
  pages use the badge.
- **DR-11 Records** — `docs/components.md` entries for the sourced patterns,
  STATUS.md section, this plan.

## Verification per task
`pnpm typecheck && pnpm lint`; local screenshots at 375 and 1280; `pnpm build`
before the final push. Balance audit (§3.4 ①–⑤) on every touched page.

## Sourcing (rule 11 — live 21st.dev search, 4 Sep)
- CtaBand ← search "call to action band section title description two buttons":
  shadcnblocks *Cta 10* (left-aligned, two buttons) chosen; *Cta 11* (centred)
  and *Cta 4* (bullet list) rejected — centred text breaks the left-edge rule ①.
- Auth shell ← search "split screen login page brand panel left form right":
  lavikatiyar *Login* (two-column, image panel) chosen for the shape;
  felipemenezes098 *Sign In Split Screen* rejected — gradient + social login.
- FeatureCard ← search "feature card grid icon title description":
  shadcnblocks *Feature 72* chosen; efferd *Grid Feature Cards* rejected —
  hover-lift; lavikatiyar *Feature Grid* rejected — image-led.
