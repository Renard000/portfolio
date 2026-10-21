-- Migration 5 : certifications et distinctions (bourses, mérites, prix, honneurs)

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null,
  category text,
  description text,
  issue_date date not null,
  expiry_date date,
  credential_id text,
  credential_url text,
  image_url text,
  document_url text,
  skills text[] default '{}',
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.certifications (issue_date desc);

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'award'
    check (type in ('scholarship','merit','award','honor')),
  organization text not null,
  description text,
  amount numeric(12,2),
  currency text default 'CAD',
  awarded_at date not null,
  image_url text,
  document_url text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.awards (awarded_at desc);

alter table public.certifications enable row level security;
alter table public.awards enable row level security;

create policy certifications_read on public.certifications for select using (true);
create policy awards_read on public.awards for select using (true);

create policy certifications_admin on public.certifications
  for all using (public.is_admin()) with check (public.is_admin());
create policy awards_admin on public.awards
  for all using (public.is_admin()) with check (public.is_admin());

-- Bucket public pour les documents (PDF), écriture réservée à l'admin.
-- Idempotent : sans danger si le bucket a déjà été créé à la main.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

create policy documents_admin_write on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin());
create policy documents_admin_update on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin());
create policy documents_admin_delete on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());
