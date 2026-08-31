-- P1-01 — §5.1 enums, verbatim.
create type app_role as enum ('registered', 'member', 'committee', 'admin');
create type membership_tier as enum ('adult', 'junior', 'family');
create type membership_status as enum ('pending', 'active', 'expired', 'cancelled', 'refunded');
create type payment_source as enum ('paypal', 'manual_bank', 'manual_cash', 'imported', 'complimentary');
create type visibility as enum ('public', 'members', 'committee');
create type booking_status as enum ('booked', 'waitlist', 'cancelled', 'attended', 'no_show');
create type campaign_status as enum ('draft', 'sending', 'sent', 'failed');
