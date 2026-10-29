-- Migration 6 : séries et vidéos (addendum C). Les fichiers vivent sur S3 :
-- la base ne garde que des CLÉS (jamais d'URL complète).

create table public.video_series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_url text,
  category text,
  level text not null default 'beginner'
    check (level in ('beginner','intermediate','advanced')),
  tags text[] default '{}',
  language text not null default 'fr',
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.video_series(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  -- Clés dans le bucket S3 (jamais d'URL complète)
  -- « .. » et « // » sont refusés : une clé ne doit jamais pouvoir remonter hors de son dossier
  video_key text not null check (video_key ~ '^videos/[a-z0-9/_.-]+\.mp4$' and video_key !~ '\.\.|//'),
  poster_key text check (poster_key ~ '^posters/[a-z0-9/_.-]+\.(jpg|png|webp)$' and poster_key !~ '\.\.|//'),
  size_bytes bigint,
  duration_seconds integer not null check (duration_seconds > 0),
  position integer not null default 1,
  chapters jsonb not null default '[]',
  resources jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published')),
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (series_id, slug),
  -- différé : permet d'échanger deux positions dans une même transaction
  constraint videos_series_position_key unique (series_id, position)
    deferrable initially deferred
);
create index on public.videos (series_id, position);

alter table public.video_series enable row level security;
alter table public.videos enable row level security;

-- Lecture publique : uniquement le contenu publié
create policy video_series_read on public.video_series
  for select using (status = 'published');
create policy videos_read on public.videos
  for select using (
    status = 'published'
    and exists (
      select 1 from public.video_series s
      where s.id = videos.series_id and s.status = 'published'
    )
  );

-- Écriture : admin uniquement. Aucune insertion publique.
create policy video_series_admin on public.video_series
  for all using (public.is_admin()) with check (public.is_admin());
create policy videos_admin on public.videos
  for all using (public.is_admin()) with check (public.is_admin());

-- Compteur de vues : appelé par le serveur uniquement
create or replace function public.increment_video_views(p_video_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.videos set views = views + 1
  where id = p_video_id and status = 'published';
$$;
revoke execute on function public.increment_video_views(uuid) from public, anon, authenticated;

-- Réordonnancement atomique : une seule instruction dans une transaction ;
-- la contrainte (series_id, position) étant différée, les échanges sont permis.
create or replace function public.reorder_videos(p_series_id uuid, p_video_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(array_length(p_video_ids, 1), 0)
       <> (select count(*) from public.videos where series_id = p_series_id)
     or (select count(distinct i) from unnest(p_video_ids) i)
       <> coalesce(array_length(p_video_ids, 1), 0)
     or exists (
       select 1 from unnest(p_video_ids) i
       where not exists (select 1 from public.videos v where v.id = i and v.series_id = p_series_id)
     )
  then
    raise exception 'Ordre invalide : la liste doit contenir exactement les vidéos de la série';
  end if;
  update public.videos v set position = o.ord
  from unnest(p_video_ids) with ordinality as o(id, ord)
  where v.id = o.id and v.series_id = p_series_id;
end;
$$;
revoke execute on function public.reorder_videos(uuid, uuid[]) from public, anon, authenticated;
