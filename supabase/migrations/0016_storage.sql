-- P1-16 — §5.3 storage buckets and object policies.
insert into storage.buckets (id, name, public) values
  ('site-images', 'site-images', true),
  ('avatars', 'avatars', false),
  ('documents-public', 'documents-public', true),
  ('documents-members', 'documents-members', false)
on conflict (id) do nothing;

-- site-images: anyone reads (public bucket), committee writes.
create policy "site-images committee write" on storage.objects
  for insert with check (bucket_id = 'site-images' and has_role(auth.uid(), 'committee'));
create policy "site-images committee update" on storage.objects
  for update using (bucket_id = 'site-images' and has_role(auth.uid(), 'committee'));
create policy "site-images committee delete" on storage.objects
  for delete using (bucket_id = 'site-images' and has_role(auth.uid(), 'committee'));
create policy "site-images read" on storage.objects
  for select using (bucket_id = 'site-images');

-- avatars: owner writes their own file ({user_id}.webp), members read
-- (served via signed URLs, but the select policy is the real gate).
create policy "avatars owner write" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and name like auth.uid()::text || '.%'
  );
create policy "avatars owner update" on storage.objects
  for update using (
    bucket_id = 'avatars' and name like auth.uid()::text || '.%'
  );
create policy "avatars owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and name like auth.uid()::text || '.%'
  );
create policy "avatars members read" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and (is_current_member(auth.uid()) or has_role(auth.uid(), 'committee'))
  );

-- documents-public: anyone reads, committee writes.
create policy "documents-public committee write" on storage.objects
  for insert with check (bucket_id = 'documents-public' and has_role(auth.uid(), 'committee'));
create policy "documents-public committee update" on storage.objects
  for update using (bucket_id = 'documents-public' and has_role(auth.uid(), 'committee'));
create policy "documents-public committee delete" on storage.objects
  for delete using (bucket_id = 'documents-public' and has_role(auth.uid(), 'committee'));
create policy "documents-public read" on storage.objects
  for select using (bucket_id = 'documents-public');

-- documents-members: current members read (signed URLs), committee writes.
create policy "documents-members committee write" on storage.objects
  for insert with check (bucket_id = 'documents-members' and has_role(auth.uid(), 'committee'));
create policy "documents-members committee update" on storage.objects
  for update using (bucket_id = 'documents-members' and has_role(auth.uid(), 'committee'));
create policy "documents-members committee delete" on storage.objects
  for delete using (bucket_id = 'documents-members' and has_role(auth.uid(), 'committee'));
create policy "documents-members member read" on storage.objects
  for select using (
    bucket_id = 'documents-members'
    and (is_current_member(auth.uid()) or has_role(auth.uid(), 'committee'))
  );
