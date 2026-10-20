create policy images_admin_write on storage.objects for insert
  with check (bucket_id = 'images' and public.is_admin());
create policy images_admin_update on storage.objects for update
  using (bucket_id = 'images' and public.is_admin());
create policy images_admin_delete on storage.objects for delete
  using (bucket_id = 'images' and public.is_admin());