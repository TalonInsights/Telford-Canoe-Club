-- A third site status: amber, "open but with a standing notice" (Simon's
-- example: "Site open, road diversion in place").
--
-- Amber sits between open and closed and the site is still usable, so nothing
-- that treats 'closed' as shut should trip on it — today only the home status
-- strip reads site_status, and it shows amber as open-with-a-warning. The note
-- column already exists; amber simply makes it meaningful while still open.
alter table club_settings
  drop constraint if exists club_settings_site_status_check;
alter table club_settings
  add constraint club_settings_site_status_check
  check (site_status in ('open', 'amber', 'closed'));
