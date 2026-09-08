-- 0021 — committee photos (client order 8 Sep 2026: a picture beside each
-- committee name). The file lives in the public site-images bucket at
-- committee/{role_id}/photo-{ts}.{ext} (committee write, anyone read — 0016);
-- this column records which object the role shows. Null = initials tile.
alter table committee_roles add column if not exists photo_path text;
