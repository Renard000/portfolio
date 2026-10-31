-- Migration 9 : version anglaise facultative des contenus saisis dans l'admin.
-- Ex. {"title": "...", "excerpt": "..."} ; un champ absent retombe sur le français.
alter table public.articles add column en jsonb not null default '{}';
alter table public.certifications add column en jsonb not null default '{}';
alter table public.awards add column en jsonb not null default '{}';
alter table public.projects add column en jsonb not null default '{}';
alter table public.video_series add column en jsonb not null default '{}';
alter table public.videos add column en jsonb not null default '{}';
