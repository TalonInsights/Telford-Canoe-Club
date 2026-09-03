# Payments & membership — how it works (P4-09)

The membership system is fully built and runs **now** on a **simulated payment
gateway**. Nothing here needs the club's PayPal account to work end to end for
testing — switching to real PayPal later is a settings change plus an
environment paste, not a rebuild.

## The one switch that matters

`club_settings.payment_provider`, editable at **Admin → Settings**:

| Value | What members see | How a membership activates |
| --- | --- | --- |
| `off` | Treasurer bank/cash only | Committee records the payment |
| `simulated` *(default now)* | "Pay online now" → a test gateway | The gateway's Approve button (no money moves) |
| `paypal` | "Pay online now" → real PayPal | PayPal captures, then the server activates |

This switch is enforced **in the database**, not just the UI. The function
that activates a membership from a browser-initiated capture
(`complete_online_payment`) refuses unless the provider is `simulated`. So the
moment the club goes to `paypal`, the self-serve simulation door is shut
everywhere at once — a stale browser tab can't activate anything for free.

## The member journey

1. **Choose a tier** at `/welcome` (adult / junior / family; family lists the
   household). Two buttons: **Pay online now** or **Pay the treasurer**.
2. **Pay online** → `/checkout/<order>` (the gateway). Approve → membership
   **active** instantly, role promoted, receipt emailed, committee notified.
   Decline → nothing taken, stays pending. Cancel → back to the treasurer route.
3. **Pay the treasurer** → membership sits **pending**; the member sees the
   bank details and can still switch to online later.
4. **Renewal**: when the next year's period exists and the current one ends
   within 60 days, `/members/membership` offers **Renew** (same flow, next
   period).

## The committee journey

- **Admin → Overview**: the "Payments to record" queue — one click records a
  bank/cash payment and activates the membership.
- **Admin → Members**: filter by *Paid up / Awaiting payment / Never paid* and
  by tier; search; CSV export. Answers "who has actually paid?" in two taps.
- **Member record**: record payment, **extend a year** (goodwill £0
  complimentary into the next period), **cancel** (with reason), **mark
  refunded** (record-keeping — issue the money in PayPal/at the bank first).
- **Admin → Add a membership**: sign someone up directly (walk-up cash,
  imported member). Reuses their pending row if they already requested a tier.

Every one of these writes to the **audit log** (Admin → Audit log).

## What "pending" means with real PayPal

PayPal can hold a payment for review (eCheque, risk). The webhook records the
`PENDING`/`DENIED` outcome and audits it; the membership stays pending until a
`COMPLETED` capture arrives. The webhook is the reconciliation path — if a
member closes the tab mid-capture, the webhook still activates them (idempotent
on the capture id, so replays never double-charge or duplicate).

## Going live with real PayPal (Phase 4 close-out, needs D1)

1. Confirm the club owns the PayPal business account (**D1**). Create a REST
   app (sandbox + live) in the PayPal developer dashboard.
2. Add to the environment (Vercel + `.env.local`):
   ```
   PAYPAL_CLIENT_ID=…
   PAYPAL_CLIENT_SECRET=…
   PAYPAL_ENV=sandbox        # then 'live'
   PAYPAL_WEBHOOK_ID=…       # from the webhook you register
   ```
3. Register the webhook URL `https://<domain>/api/paypal/webhook` for
   `PAYMENT.CAPTURE.COMPLETED/REFUNDED/DENIED/PENDING`.
4. Set **Admin → Settings → Online payment** to **PayPal (live)**.
5. Sandbox-test a purchase; confirm the member appears in `current_members`,
   the members area opens, and a sandbox refund flips the status via the
   webhook.

The real client (`lib/payments/paypal.ts`) is already written to the Orders v2
spec and is dormant until those variables exist — with the switch on `paypal`
but the variables missing, calls fail loudly rather than half-working.

## Treasurer's refund procedure

Refunds are issued **in PayPal** (Activity → the transaction → Refund) or by
returning bank/cash. Then, on the member record, use **Mark refunded** with a
note of where it went. In `paypal` mode the refund webhook sets the status
automatically; the manual button is the twin for bank/cash refunds.

## Changing prices

Admin → Settings → the three tier prices (in £). Saved with an audit entry;
the join page, welcome flow and checkout all read the new figures immediately.

## Crons (Vercel, `vercel.json`)

- `/api/cron/expiry-sweep` (daily 02:00): expires memberships whose period has
  ended and moves `is_current` when the calendar rolls over. Idempotent.
- `/api/cron/renewal-reminders` (daily 09:00, acts only on 1 Dec / 15 Dec /
  2 Jan): emails active members with no next-year membership. **Dry-run by
  default** — set `RENEWAL_REMINDERS_DRY_RUN=false` (with a Resend key) to send.

Both accept an optional `CRON_SECRET` bearer; Vercel Cron sends it when set.

## Proof it works

`supabase/tests/payments-harness.sql` runs the whole loop against the live
database — request → begin → capture → active → role promotion →
`current_members` → audit — plus idempotency, foreign-capture refusal, the
provider mode gate, abandon, renewal, admin create/extend and the expiry
sweep. **31/31 assertions pass.**
