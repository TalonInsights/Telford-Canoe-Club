# Change request, September 2026

Source: Simon Wiles via Talon, 9 Sep 2026. Eight items, all additions to an
approved build, none of them defect fixes. Written before any code per §0 rule 1.

## Order of work

Built in dependency order, cheapest and most independent first, so each lands
whole rather than eight half-built things landing together.

| # | Item | Migration | Status |
| --- | --- | --- | --- |
| 3 | River level bands, admin managed | 0024 | |
| 4 | Farson webcam link at Atcham | 0024 | |
| 6 | Shop item visibility + shop open/closed | 0024 | |
| 7 | Notice-only events | 0024 | |
| 5 | Editable page content blocks | 0025 | |
| 8 | Member check-in | 0026 | |
| 1 | Membership types as records | 0027 | |
| 2 | Member email with segments | 0028 | |

## Decisions taken before writing code

**D1. River bands are stored in centimetres.**
Simon's worked example is "under 50", "50 to 100", "over 100", "over 200". The
Environment Agency gauge reports metres, and Buildwas sat at 0.37 m all of
8 September. Read as metres his numbers would be a fifty-metre flood, so they
are centimetres: 37 cm is "Surfs up", which matches how he describes the rapid
today. Bands are therefore stored as whole centimetres, the admin screen says
centimetres on the field, and the public page prints the reading in both units
so nobody has to convert in their head. **Flagged to the client for
confirmation**, because it is an assumption about his numbers, not a fact.

**D2. Overlaps and gaps warn, they do not block.**
A club that wants a deliberate gap should be able to have one. The editor
checks the whole ladder after every change and shows what it found, and the
public matcher takes the first band that contains the reading, lowest first.

**D3. The webcam is linked, never embedded.**
Farson's stream is their property and the request explicitly rules out
hotlinking or scraping. The link opens in a new tab and always carries the
distance note, which is stored beside the URL so the committee can reword it.

**D4. Notice-only is a property of the event, enforced by a constraint.**
A `kind` column with a check that a notice-only event cannot have booking
switched on. That way the rule holds even if a future screen forgets it, and
the booking function needs no change because it already refuses an event with
booking off.

**D5. The shop gets a master switch as well as per-item visibility.**
The club sells twice a year, so the common case is "everything off". Per-item
hiding alone would mean toggling every item twice a year. The switch is
recommended in the request and is built; it is one setting and easy to remove
if Simon would rather not have it.

**D6. Editable content is blocks on known pages, not a page builder.**
Recommended in the request and agreed here: a defined set of editable blocks on
existing pages, each with a draft and a published version so there is a preview
before anything goes live. A general CMS is a much larger piece of work and is
flagged to the client rather than assumed.

**D7. Check-in ships switched off, pending a committee decision.**
The request is explicit that the club is the data controller and that the
committee must decide visibility, name format and retention before this is
built. It is built to the conservative end of every option the request lists,
and it is off until an admin turns it on, so nothing about a member's
whereabouts can be shown to anyone until the committee has actually decided.
Under-18 accounts are excluded in the database, not merely in the UI.

**D8. Existing memberships are never rewritten when tiers become records.**
The membership rows keep the tier they were sold on. A type carries its own
price and duration, and deactivating a type only removes it from the join page.
