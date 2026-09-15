# Member records, committee edits, and a change log worth reading

Source: Talon, 15 Sep 2026 — "members can update their records, admins can
adjust member records too, all changes logged, and make the change log easier
to navigate when looking for certain events."

Written before code per §0 rule 1.

## Where it starts

- **Members** can already edit phone, address, postcode, Paddle UK number,
  emergency contact and the news opt-in. Not their name, date of birth or
  guardian details — the form tells them to email the committee. **None of it
  is logged.**
- **The committee** can edit nothing at all from a member's record. The page is
  read-only apart from membership actions.
- **The audit log** is a raw dump: the last 200 rows, database action keys
  (`membership.payment_recorded`), raw JSON in the detail column, no actor
  name, no search, no filter, no date range.

## Order of work

| # | Item | Where |
| --- | --- | --- |
| 1 | Log every profile change in the database, not the app | 0031 |
| 2 | Members edit their contact, emergency and guardian details | members/profile |
| 3 | The committee edits a record; admins also the name and date of birth | admin/members/[id], 0032 |
| 4 | An audit log you can actually search | admin/audit |
| 5 | Say so in the privacy notice | about/privacy |

## Decisions taken before writing code

**D1. The log is a database trigger, not a line in the action.**
Every other switch in this build is enforced where it cannot be bypassed, and a
change log written by the app only records changes made through the app. A
trigger on `profiles` catches the member's own form, the committee's form, a
future screen nobody has written yet, and a hand-run `UPDATE`.

**D2. The log records which fields changed; it records values only where the
value is the point.**
An audit log is permanent and readable by admins. Copying a member's home
address into it on every save creates a second, growing store of exactly the
personal data the club has promised to minimise, for no gain — the committee
can already see the current value, and "address changed" answers the question
the log exists to answer.

So: **names, date of birth, the news opt-in, Paddle UK number and role record
their before and after**, because there the old value is what you need in order
to check or undo a change. **Phone, address, emergency contact and guardian
details record only that they changed.** Free-text internal and medical notes
are not touched by this work at all.

**D3. Name and date of birth are fixed at sign-up and changed only by an
admin.** *(Client ruling, 15 Sep, replacing the softer rule below.)*
Date of birth decides `is_junior()`, which keeps under-18 accounts off the
on-site board and drives safeguarding elsewhere; the name is what ties the
membership record to a person. Neither is the member's to change, and neither
is the committee's. Enforced in a trigger (0032) rather than only in the forms,
so it holds for a screen nobody has written yet. A change made with nobody
signed in is still allowed: an authenticated request always carries a uid, so a
null one is the service key, and refusing it would leave no way to correct an
imported record at all. It is recorded as `profile.updated_by_system`.

**D3a. What that replaced, and why the first reading was wrong.**
0031 shipped the softer rule below: a member could rename themselves freely and
fill in a blank date of birth, and any committee member could change either.
The reasoning was that people do change names, and a club that makes you email
somebody about it ends up with a members list that is quietly wrong. The club's
position is the opposite and is the better one here: these are the two fields a
membership, a Paddle UK affiliation and a safeguarding decision are all keyed
on, so a rare correction going through an admin is cheaper than an unnoticed
change to any of them. Superseded text:

> **A member may set a missing date of birth, but not change one already
> recorded.** Date of birth decides `is_junior()`, which is what keeps under-18
> accounts off the on-site board and drives safeguarding elsewhere. A member who
> can edit it freely can switch their own junior status off. Filling in a blank
> is completing your record; changing one that exists is a safeguarding-relevant
> fact and goes through the committee.

**D4. Email address stays uneditable, in both places, and the screens now say
why.**
`profiles.email` is a mirror of the login address, kept in step by a trigger on
`auth.users`. Writing it directly would leave someone logging in with the old
address while club email went to the new one — a silent split that is worse
than the inconvenience it fixes. Changing it properly means the account holder
confirming the new address, which needs the club's email working (D5). Flagged,
not bodged.

**D5. The committee edits records; only an admin changes roles, names and
dates of birth.**
Editing a member's contact details is ordinary club administration and matches
the existing RLS, which already gives the committee write access to every
profile except `role`. The three things that decide who somebody *is* on the
site — their role, their name and their date of birth — sit above that line:
roles in the admin-only panel from 0030, the other two under D3.

**D6. The log is grouped by day, labelled in English, and filtered by
category, person and date — not paginated 200 rows of JSON.**
"Easier to navigate when looking for certain events" is the actual requirement,
so the work is in the reading, not the storing: every action gets a plain-English
label and a category, the actor and the subject get names instead of UUIDs, the
detail becomes a sentence, and an unknown action still renders readably rather
than as a raw key, so the log does not rot as the site grows.

## Deliberately not in this change

- **Family members on a household membership** (`membership_members`) still
  cannot be edited after purchase. A child's emergency contact going stale is a
  real safety issue for a paddling club, so this is worth doing — but it is a
  separate surface with its own rules about who may edit whom, not a corner of
  this one. Flagged to the client.
- **Retention for the audit log.** The register requires a stated retention
  period with a job behind it (SEC-013). The log has never had one. D2 keeps
  personal values out of it, which is the larger half of the problem, but the
  club still needs to name a period. Deleting the club's own accountability
  record is their decision, not ours, so this is raised rather than assumed.
- **`medical_notes`** is a column nothing in the site reads or writes. It is
  health data, which carries extra obligations, and it stays untouched until
  the committee asks for it deliberately.
