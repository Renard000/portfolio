create or replace function public.increment_views(p_article_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.articles set views = views + 1
  where id = p_article_id and status = 'published';
$$;

create or replace function public.increment_likes(p_article_id uuid)
returns integer language sql security definer set search_path = public as $$
  update public.articles set likes = likes + 1
  where id = p_article_id and status = 'published'
  returning likes;
$$;

-- Seul le serveur (service_role) peut les appeler
revoke execute on function public.increment_views(uuid) from public, anon, authenticated;
revoke execute on function public.increment_likes(uuid) from public, anon, authenticated;