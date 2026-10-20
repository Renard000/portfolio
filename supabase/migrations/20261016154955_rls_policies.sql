-- Fonction utilitaire : l'utilisateur connecté est-il admin ?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists comments_insert on public.comments;
drop policy if exists messages_insert on public.messages;

alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.articles    enable row level security;
alter table public.comments    enable row level security;
alter table public.messages    enable row level security;
alter table public.subscribers enable row level security;
alter table public.skills      enable row level security;

-- Lecture publique
create policy projects_read on public.projects for select using (true);
create policy skills_read   on public.skills   for select using (true);
create policy articles_read on public.articles for select using (status = 'published');
create policy comments_read on public.comments for select using (approved = true);

-- Écriture réservée à l'admin
create policy projects_admin on public.projects for all using (public.is_admin()) with check (public.is_admin());
create policy skills_admin   on public.skills   for all using (public.is_admin()) with check (public.is_admin());
create policy articles_admin on public.articles for all using (public.is_admin()) with check (public.is_admin());
create policy comments_admin on public.comments for all using (public.is_admin()) with check (public.is_admin());
create policy messages_admin on public.messages for all using (public.is_admin()) with check (public.is_admin());
create policy subs_admin     on public.subscribers for all using (public.is_admin()) with check (public.is_admin());

-- Aucune insertion publique : commentaires, messages et abonnements
-- sont écrits uniquement par l'API Node (service_role).
-- Le serveur valide (Zod), limite la fréquence et vérifie que l'article est publié.

-- Profil : chacun lit le sien
create policy profiles_self on public.profiles for select using (id = auth.uid());