# Minutes, committee records and the club shop

Client order, 8 Sep 2026 (Simon, via Talon):

1. Admins can put up **committee meeting minutes**, visible to every member,
   written from a **template** they fill in: date, title, then the minutes,
   with headings that look like headings.
2. An area in the admin folder for **committee-only documents**: bookings,
   council contacts, inventory. "Ensure sufficient security is in place."
3. An area where members can **order club merchandise** (beanie and hoodie as
   the worked examples, photographs to follow), and a way for admins to
   **manage those orders through to fulfilment**, paying through the same
   simulated PayPal backend as membership.

This plan follows §0 rule 1: written before any code, executed top to bottom.
It spans work the spec had parked in Phase 6 (documents) and adds a shop the
spec never contemplated, so it is recorded here rather than in a phase file.

## Decisions taken before writing code

**D-A. Minutes are written in the site, not uploaded as a file.**
The order asks for a template to fill in, which a PDF upload cannot be. Minutes
become a record with a meeting date, a title, and a body. A file can be
attached as well for the signed original, but the readable minutes live in the
database so they are searchable, printable and readable on a phone.

**D-B. The body is a list of typed blocks, not rich text.**
"The ability to change font for headers" needs headings that render larger. A
full rich-text editor (Tiptap, spec §2 for Phase 7) is not installed, and
installing one drags in a sanitising renderer, a schema and a security surface
for what is being asked here. Instead the body is an ordered list of blocks,
each one a heading, a paragraph or a bullet list. The editor is a list of rows
with a type selector and a text box. That gives real headings, cannot carry
injected HTML because no HTML is ever stored, and matches how `events.body`
already works. When Phase 7 brings Tiptap in, these blocks convert cleanly.

**D-C. New minutes start from the club's standard agenda.**
Creating a set of minutes pre-fills the headings a committee meeting actually
uses (present, apologies, minutes of the last meeting, matters arising,
treasurer, membership, site and equipment, events and coaching, any other
business, date of the next meeting). That is the "template they can fill in".
Every heading is editable and removable.

**D-D. Committee-only files get their own private bucket.**
Not a visibility flag on the members bucket. Storage policies are the real
security boundary: if committee files sat in `documents-members`, any current
member who guessed an object path could read them, whatever the table row said.
A separate bucket whose every policy demands `has_role(auth.uid(),'committee')`
means the guess fails at the storage layer, not just in the query.

**D-E. A member's basket is a draft order row.**
Ordering a beanie and a hoodie should be one payment. The basket is a
`merch_orders` row in `draft`, with `merch_order_items` under it, protected by
the same row-level rules as the finished order. No client-side cart to lose, no
prices trusted from the browser: the line price is copied from the product by a
database function at the moment the item is added.

**D-F. The shop reuses the membership payment switch, it does not copy it.**
Prices come from the products table server-side, the order total is recomputed
in the database, and the same `club_settings.payment_provider` switch decides
whether a simulated payment may complete. Flipping the club to live PayPal must
close the free-checkout door for merchandise at the same instant it closes it
for membership, at the database, not in the UI.

## Order of work

Filled in below as each step lands; migrations are numbered from 0022.

## What was built

**Migrations (applied live 8 Sep 2026, types regenerated).**
`0022_minutes_and_committee_documents.sql` — `meeting_minutes`, a widened
`documents` category list, and the private `documents-committee` bucket.
`0023_merch.sql` — `merch_products`, `merch_orders`, `merch_order_items`, the
basket and payment functions, and the beanie and hoodie as seed items.

**Minutes.** `lib/minutes/blocks.ts` (block model + the club's agenda
template), `lib/queries/minutes.ts`, `lib/actions/minutes.ts`,
`components/admin/minutes-editor.tsx`,
`components/admin/minutes-status-buttons.tsx`,
`components/site/minutes-view.tsx`, `/admin/minutes{,/new,/[id]}`,
`/members/minutes{,/[id]}`.

**Documents.** `lib/storage/documents.ts` (bucket per visibility, categories,
paths), `lib/queries/documents.ts` (batched signed URLs),
`lib/actions/documents.ts`, `components/admin/document-manager.tsx`,
`/admin/documents`, and a rebuilt `/members/documents`.

**Shop.** `lib/merch/labels.ts`, `lib/queries/merch.ts`, `lib/actions/merch.ts`,
`components/members/shop-client.tsx`, `components/admin/merch-orders.tsx`,
`components/admin/merch-products-editor.tsx`, `/members/shop{,/orders}`,
`/admin/shop`, `/checkout/shop/[orderRef]`, and a `createMerchOrder` method on
both payment providers.

## Proved on the live database, 8 Sep 2026

Impersonation note: the subquery form of `set_config` that Phase 5 used does
**not** apply row-level security to a plain select, because a subquery in the
target list is evaluated before the role switch takes hold. It silently reports
success. The form that works is a real transaction:
`begin; set local role authenticated; select set_config('request.jwt.claims', …, true); <query>; rollback;`

| Check | Result |
| --- | --- |
| Member reading committee documents | 0 rows |
| Member reading the committee storage bucket | 0 objects |
| Member reading a draft set of minutes | 0 rows |
| Member reading published minutes | 1 row |
| Committee reading everything | 5 documents, 2 of them committee-only |
| Anonymous visitor | 1 public document, 0 minutes, 0 orders |
| Basket maths, 2 hoodies + 1 beanie | £72.00 |
| Hoodie with no size, or a size that does not exist | refused |
| Quantity of 999 | refused |
| Capture by somebody who does not own the order | "order not found" |
| Capture replayed with the same reference | same order id, no double charge |
| Second, different capture on a paid order | refused |
| Capture while the club is in PayPal mode | refused at the database |
| Starting a payment while online payment is off | refused at the database |
| Member trying to mark their own order handed over | "committee only" |

Test artefacts were removed afterwards, along with the three `rls-*` harness
documents left over from Phase 1, which would otherwise have appeared as junk
in the new screens while the chairman is testing.
