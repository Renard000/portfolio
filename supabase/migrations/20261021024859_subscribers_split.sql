-- Migration 4 : séparer newsletter (courriel) et notifications push (jetons FCM)

-- 1) L'ancienne table (jetons FCM) devient push_subscriptions.
--    Ses RLS et sa policy admin restent attachées à la table.
alter table public.subscribers rename to push_subscriptions;
alter table public.push_subscriptions add column active boolean not null default true;

-- Noms de contraintes/policy alignés sur la nouvelle table (libère aussi
-- le nom subscribers_pkey pour la nouvelle table).
alter table public.push_subscriptions
  rename constraint subscribers_pkey to push_subscriptions_pkey;
alter table public.push_subscriptions
  rename constraint subscribers_fcm_token_key to push_subscriptions_fcm_token_key;
alter policy subs_admin on public.push_subscriptions rename to push_subscriptions_admin;

-- 2) Nouvelle table subscribers : newsletter par courriel
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  active boolean not null default true,
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Unicité insensible à la casse
create unique index subscribers_email_key on public.subscribers (lower(email));
create unique index subscribers_confirm_token_key on public.subscribers (confirm_token);
create unique index subscribers_unsubscribe_token_key on public.subscribers (unsubscribe_token);

alter table public.subscribers enable row level security;

-- Lecture et gestion réservées à l'admin.
-- Pas d'insertion publique : l'inscription passe par le serveur
-- (limitation de fréquence, courriel de confirmation).
create policy subscribers_admin on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());
