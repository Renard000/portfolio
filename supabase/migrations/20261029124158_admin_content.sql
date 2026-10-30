-- Migration 7 : contenu géré depuis l'admin (projets, compétences), blog et tableau de bord.
-- Ne modifie aucune migration déjà appliquée : uniquement des ajouts.

-- 1) Projets : colonnes de la page détail (maquette P-12) et de l'ordre d'affichage
alter table public.projects
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists challenge text,
  add column if not exists solution text,
  add column if not exists role text,
  add column if not exists duration text,
  add column if not exists year text,
  add column if not exists results text[] not null default '{}',
  add column if not exists color text,
  add column if not exists featured boolean not null default false,
  add column if not exists sort_order integer not null default 0;

-- Les projets existants (créés sans slug) reçoivent un slug dérivé de leur identifiant.
update public.projects set slug = 'projet-' || left(id::text, 8) where slug is null;
alter table public.projects alter column slug set not null;
create unique index if not exists projects_slug_key on public.projects (slug);
alter table public.projects drop constraint if exists projects_color_check;
alter table public.projects add constraint projects_color_check
  check (color is null or color ~ '^#[0-9a-fA-F]{6}$');

-- 2) Compétences : ordre d'affichage
alter table public.skills
  add column if not exists sort_order integer not null default 0;

-- 3) Index utiles à la modération et aux messages
create index if not exists comments_article_idx on public.comments (article_id, created_at desc);
create index if not exists comments_pending_idx on public.comments (approved, created_at desc);
create index if not exists messages_lu_idx on public.messages (lu, created_at desc);

-- 4) Journal des vues d'articles (statistiques du tableau de bord : 30 jours, 12 mois).
--    Aucune donnée personnelle : seulement l'article et la date.
create table if not exists public.article_views (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists article_views_date_idx on public.article_views (viewed_at desc);
alter table public.article_views enable row level security;
-- Aucune policy : seul le serveur (service_role) lit et écrit cette table.

-- increment_views : incrémente le compteur ET journalise la vue
create or replace function public.increment_views(p_article_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.articles set views = views + 1
  where id = p_article_id and status = 'published';
  if found then
    insert into public.article_views (article_id) values (p_article_id);
  end if;
end;
$$;
revoke execute on function public.increment_views(uuid) from public, anon, authenticated;

-- Vues par mois sur les 12 derniers mois (mois sans vue inclus, valeur 0)
create or replace function public.article_views_by_month()
returns table (month date, views bigint) language sql stable security definer set search_path = '' as $$
  select m::date as month,
         (select count(*) from public.article_views v
           where v.viewed_at >= m and v.viewed_at < m + interval '1 month') as views
  from generate_series(
         date_trunc('month', now()) - interval '11 months',
         date_trunc('month', now()),
         interval '1 month'
       ) as m
  order by m;
$$;
revoke execute on function public.article_views_by_month() from public, anon, authenticated;
