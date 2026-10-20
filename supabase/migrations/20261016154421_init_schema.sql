create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  bio text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin'))
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  category text,
  tech text[] default '{}',
  github_url text,
  live_url text,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_url text,
  category text,
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  views integer not null default 0,
  likes integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.articles (status, published_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author text not null,
  content text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  sujet text,
  message text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  fcm_token text not null unique,
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level integer not null check (level between 0 and 100),
  icon text
);