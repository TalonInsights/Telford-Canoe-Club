# AGM launch — Simon's 27 Sep–14 Oct spec

Source: Simon Wiles (Chair), Messenger thread, relayed by Talon 19 Oct 2026.
**Launch target: club AGM, Jackfield, 7 Nov 2026, 6pm.** ~19 days.

Hard constraint from Simon: events "work well and look good" — **do not regress
existing event behaviour** while adding to it.

This plan triages all of it. Built top to bottom within a phase (§0 rule 1),
one element complete before the next (rule 2), tick in STATUS only when the
acceptance line is true (rule 3).

## Status at a glance

| # | Item | Verdict | Where |
| --- | --- | --- | --- |
| 1.1 | Profile/committee photo "unexpected photo path" | **DONE, pushed** | `committee.ts`, `site-images.ts` |
| 1.2 | River gauge points to wrong station | **CONFIRM w/ Simon** | code already Buildwas 2134 |
| 1.3 | "Page words" admin area blank | **VERIFY LIVE** | code correct; data/deploy |
| 1.4 | "D2:" dev prefix on membership-year field | **DONE, pushed** | `settings-form.tsx` |
| 1.5 | Wrong images (waterfall, 2 paddleboard) | **BLOCKED** | needs images from Simon |
| 2 | Amber site status | **DONE, pushed** (0033) | enum + status strip + settings |
| 3.1 | Camping + Black Swan tiles | **DONE, pushed** (Black Swan ends at "food") | `/venue` |
| 3.2 | Six exact wording changes | **DONE, pushed** | `hero.tsx`, `sections.tsx`, `site-data.ts` |
| 4 | "Where we paddle" managed content | **needs DB login** | migration + committee CRUD + public |
| 5.1 | Rename → "Paddle UK / governing body number" | **DONE, pushed** | everywhere the label appears |
| 5.2 | Car registration, admin/committee-only | **coded + 0034, needs DB login** | code shelved (`git stash`) pending type regen |
| 5.3 | Add a child to a family account after creation | **needs DB login** | `membership_members` + a policy/fn |
| 5.4 | Junior-turns-18 alert + type-change history | **needs DB login** | cron + a "notified" flag |
| 5.5 | Admin-create accounts + set-password email | **needs DB login + D5** | admin API, server-only |
| 5.6 | Bulk import robust, no emails before go-live | **needs DB login + D5** | dry-run / invite switch |
| 6.1 | Event audit: creator + timestamp | **DONE** (already met; labels added) | events already audited |
| 6.2 | Duplicate an event | **DONE, pushed** | admin events |
| 6.3 | Booking gate (4 conditions) | **needs DB login** | migration + booking flow |
| 6.4 | Leader attendee view (kit/medical/emergency) | **needs DB login** | with 6.3 |
| 7 | FAQ, committee-managed | **needs DB login** | migration + CRUD + Contact page |
| 8 | Minutes: uploaded doc hides empty template | **DONE, pushed** | member minutes view |

## Progress, 19 Oct

Shipped and deploying (no database change, or the change is already live):
1.1, 1.4, 2 (amber), 3.1, 3.2, 5.1, 6.1, 6.2, 8. Commits `e83af2e`, section
2/3, 5.1, and `fb2e380`.

**The wall: the Supabase dashboard is signed out in both browsers and I will
not sign in as anyone.** Everything left either adds a column or a table —
which means a migration AND a regenerated `types/database.ts`, and that file is
never hand-edited — or sends email (gated on D5), or waits on Simon. So the
remaining DB items are written as migrations but cannot be applied or
type-checked until someone signs in to Supabase. Migrations staged and ready to
apply: `0033` (amber, no new types needed, already safe), `0034` (car
registration). Once signed in I apply them, regenerate types, unshelve 5.2, and
build 4, 5.3, 5.4, 5.5/5.6, 6.3, 6.4 and 7.

## Done this turn

- **1.1** The photo-path matcher was written in a template literal with single
  backslashes, so `\d` became a literal "d" and the pattern rejected every real
  upload — Simon's "Unexpected photo path". Moved to `isCommitteePhotoPath()`
  in `lib/storage/site-images.ts` with doubled escapes, used by the action, and
  pinned by `site-images.test.ts` (accepts real builder output, refuses another
  role's folder and path traversal).
- **1.4** Removed the "D2:" developer prefix and placeholder from the
  membership-year helper. The field was already admin-editable and the stored
  default is the sensible `'Annual membership'`, so nothing leaked to the public
  join page — the dev text was only on the admin settings screen Simon quoted.

## Needs Simon (relay these)

1. **Black Swan tile** — the screenshot cuts off after "food,". Full sentence,
   or we ship it ending cleanly at "food."
2. **River gauge** — our own spec validation (and all the code) uses **Buildwas,
   Severn station 2134**; the EA station *named* "Ironbridge" is on the River
   Dee, 50 miles away, and must never be used. If the live site shows a
   different gauge it is a stale deploy or a `EA_STATION_REF` override in Vercel,
   which we clear. Ask Simon to confirm he means Buildwas, or name the station
   he believes is right.
3. **Images** — a correct waterfall image (or fix the caption) and two real
   paddleboard images, or permission to source royalty-free replacements.
4. **"Page words"** — did Simon mean more site copy should become editable
   there (we extend the editable passages), or was it only the blank-page bug?
   The area works; the blank is almost certainly the `content_blocks` rows
   missing in the environment he used — confirmed once we can read the live DB.
5. **Add-a-child (5.3)** — at sign-up, after account creation, or both? He said
   either is fine; default plan is **after creation** (his stated need: a parent
   who forgot the second child), adding the sign-up path if time allows.

## Compliance — run before the personal-data items

`node _bin/compliance.mjs required --preset=club` before 5.2, 5.5/5.6 and 6.3.

- **Car registration (5.2)** is personal data (it identifies a vehicle and
  through it a person). Store it, restrict read to committee/admin by column
  privilege (the `draft_body` pattern from 0027), and disclose it and its
  purpose ("identify a vehicle left on site") in the privacy notice.
- **Medical (6.3)** — store **only** the Yes/No flag against the booking, never
  the details. The leader contacts the member off-system. The question needs an
  explicit answer with no default. Disclose the flag in the privacy notice;
  health data, so minimisation is the whole design.
- **Bulk import / admin-create (5.5/5.6)** — **nothing may email a real member
  before go-live is intended.** Build a dry-run / "send invite emails" switch,
  default off, and make the import idempotent and safe to re-run. The
  set-password flow uses the Supabase **service-role key** — server-only, never
  exposed, never in the client bundle.
- **Junior-18 (5.4)** — notifying the committee is fine; record the membership
  type change in the audit trail so it is traceable.

## Proposed order (de-risk first, content for the AGM, complex last)

- **A. Finish section 1** — 1.2/1.3 verified live, 1.5 when images arrive.
- **B. Public-facing content** (high AGM value, low risk): 2 amber status,
  3.1 tiles, 3.2 wording, 1.5 images. The site looks right for the launch.
- **C. Members**: 5.1 rename, 5.2 car reg, 5.3 add child, 5.4 junior-18, then
  5.5/5.6 admin-create + import with the no-email guard.
- **D. Events** (most complex, must not regress): 6.1 creator audit, 6.2
  duplicate, 6.3 booking gate, 6.4 leader view. Heaviest testing here.
- **E. New managed sections**: 4 "where we paddle", 7 FAQ, 8 minutes upload.
  4 and 7 share a CRUD shape (name/photo/description/links/category, orderable)
  — build the pattern once.

## Already-known launch blockers (carried from before)

- Email confirmation is OFF — **turn back on before launch**.
- D5 Resend domain/DNS — until then no club email leaves the building, which
  gates 5.5/5.6 actually sending.
- Remove the Phase 1 `rls-*@test.invalid` accounts (one holds admin).
- D1 PayPal credentials for live payment.
