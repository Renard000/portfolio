-- Migration 8 : fil des publications (badge NEW, point rouge), modèles de courriel
-- et diffusion temps réel. Ne modifie aucune migration déjà appliquée.

-- 1) Fil des publications : écrit par le serveur, lu par le site en temps réel
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    check (kind in ('article','video','series','certification','award','project')),
  ref_id uuid not null,
  title text not null,
  path text not null,
  published_at timestamptz not null default now(),
  unique (kind, ref_id)
);
create index publications_date_idx on public.publications (published_at desc);

alter table public.publications enable row level security;
create policy publications_read on public.publications for select using (true);
-- Aucune écriture publique : seul le serveur (service_role) écrit dans ce fil.

-- 2) Modèles de courriel modifiés dans l'admin (sans ligne : modèle par défaut du code)
create table public.email_templates (
  key text primary key
    check (key in ('confirmation','reply','news','article','video','series','certification','award','project')),
  subject text not null,
  heading text not null,
  body text not null,
  cta_label text,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;
create policy email_templates_admin on public.email_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) Suivi des réponses envoyées depuis l'admin
alter table public.messages add column replied_at timestamptz;

-- 4) Diffusion temps réel. Les RLS s'appliquent : le site ne reçoit que le fil public,
--    et seul l'admin reçoit les messages, commentaires et inscriptions.
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;
  foreach t in array array['publications','messages','comments','subscribers'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
