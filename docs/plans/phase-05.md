# Phase 5 plan — events the committee runs, attendance the club can see

Client order (4 Sep 2026): *"add an area in the admin panel for adding events
that allows them to add an image and required event information to be displayed
throughout the site where events are listed. Members should be able to confirm
event attendance; admins should be able to see who attends."*

Maps to spec P5-01/02 (admin list + form with cover image), P5-04 (booking
engine), P5-05 (booking emails), P5-06 (my bookings — already live), P5-07
(admin attendee list, check-in, CSV). Tiptap body, video embeds, recurrence
and the per-member calendar feed stay on the Phase 5/7 backlog.

## Design decisions

1. **Schema already fits** (`events`, `event_bookings`, `event_media` from
   0008). No new tables. "Confirm attendance" *is* a booking: the admin form's
   "Members confirm attendance" switch is `booking_enabled` (default ON for new
   events), capacity + waitlist optional. Events without it read "just turn up".
2. **The database decides places — migration 0020.** `book_event(event_id)`
   locks the event row, checks status/window/members-only, counts confirmed
   places and inserts *booked* or *waitlist* atomically (idempotent for a
   repeat click). `cancel_booking(booking_id)` cancels (own row, or any row for
   committee) and promotes the earliest waitlisted person, returning who was
   promoted (with email) so the action can notify them. `event_attendance()`
   returns counts for the public page. All definer, all audited in-function —
   the old count-then-upsert action had a race.
3. **Cover image → Supabase Storage, straight from the browser.** Bucket
   `site-images` (public read, committee write — policies from 0016), path
   `events/{event_id}/cover-{ts}.{ext}` (§5.3). New events get their uuid in
   the form so the upload has a home before the row exists. `cover_image_path`
   stores the object path; `eventImageUrl()` resolves it (or a legacy
   `placeholders/…` path) everywhere an event is drawn, and `next.config`
   allows the storage host so `next/image` optimises it.
4. **Details text** lives in `events.body` as `{type:'text', text}` until the
   Tiptap renderer (P7-02) replaces it; rendered as paragraphs on the event page.
5. **Emails** (`lib/email/bookings.ts`): confirmed, waitlisted, promoted,
   cancelled by the club, event cancelled — Resend-gated like membership mail,
   never blocking the database write.
6. **Where events are listed** all read the same row: `/events` cards + month
   grid, `/events/[slug]` (hero image, details, attendance panel), home
   "What's on" (now `EventCard` with image), status strip, members dashboard,
   my bookings, admin overview.

## Tasks
- **P5-01** `/admin/events` — upcoming / past / drafts, counts per event,
  "Add an event". Nav entry + bottom tab.
- **P5-02** `/admin/events/new` + `/admin/events/[id]` — `EventForm` (title,
  slug, category, summary, details, start/end, location, visibility, water-level
  flag, cost, attendance settings, cover image upload/replace/remove),
  draft → publish → cancel transitions + delete, all audited.
- **P5-04** migration 0020 + `bookEventAction`/`cancelBookingAction` on the
  new functions; `BookingPanel` shows the member's own state ("You're
  confirmed" / waitlist / confirm button) and live counts.
- **P5-05** booking emails.
- **P5-07** attendees tab: name, email, phone, status, check-in / no-show /
  cancel, CSV export, counts.
- Records: `docs/components.md`, STATUS, types regenerated after 0020.

## Sourcing (rule 11, live 21st.dev search 4 Sep)
"admin event form create event date time picker image upload" → only date
pickers (already sourced as `DatePicker`/`DateTimePicker`, originui/shadcn) and
a minimal upload form (ephraimduncan *upload* — single-file, no progress;
rejected in favour of the sourced `FileUpload`). No event-form block exists, so
`EventForm` is **built** on the sourced primitives, like `PageHero`.
`AttendeesTable`/`EventsTable` reuse the sourced `DataTable`.

## Verification
`pnpm typecheck && pnpm lint` per task, `pnpm build` at the end; live DB:
create → upload image → publish → confirm as a member → appears in attendees
→ check in → cancel → waitlist promotion; concurrency guarded by the row lock.
