-- Bucket public pour les images (couvertures, projets, avatar).
-- Idempotent : sans danger si le bucket existe déjà (créé à la main depuis le tableau de bord).
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true