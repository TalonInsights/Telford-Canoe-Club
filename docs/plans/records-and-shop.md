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
