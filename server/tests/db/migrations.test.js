import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Rejoue les VRAIES migrations dans un Postgres en mémoire (PGlite) avec de
 * petits décors imitant Supabase (schémas auth/storage, rôles anon/authenticated).
 */
const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations'
);
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const read = (name) =>
  readFileSync(path.join(dir, name), 'utf8')
    // pgcrypto n'existe pas dans PGlite ; gen_random_uuid() est natif depuis PG 13.
    .replace(/create extension if not exists pgcrypto;/i, '');

const STUBS = `
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
`;

let db;
const ADMIN = '00000000-0000-0000-0000-0000000000aa';
const USER = '00000000-0000-0000-0000-0000000000bb';

async function as(role, uid, fn) {
  await db.exec(
    `set role ${role}; select set_config('test.uid', '${uid || ''}', false);`
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('test.uid', '', false);`);
  }
}

describe('migrations Supabase (PGlite)', () => {
  const SERIES = 'a0000000-0000-4000-8000-000000000001';
  const V = (n) => `b0000000-0000-4000-8000-00000000000${n}`;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(STUBS);
    // Migrations 1 à 3 + storage « images », puis des données de l'ancienne table subscribers
    const before = files.filter((f) => f < '20261020');
    for (const f of before) await db.exec(read(f));
    await db.exec(`
      insert into public.subscribers (fcm_token) values ('token-A'), ('token-B');
      insert into auth.users (id, email) values ('${ADMIN}', 'a@x.com'), ('${USER}', 'u@x.com');
      insert into public.profiles (id, nom, role) values ('${ADMIN}', 'Admin', 'admin'), ('${USER}', 'User', 'user');
    `);
    // Migrations 4 et 5
    for (const f of files.filter((f) => f >= '20261020')) await db.exec(read(f));
    await db.exec(`
      grant select, insert, update, delete on all tables in schema public to anon, authenticated;
      grant select, insert, update, delete on all tables in schema storage to anon, authenticated;
    `);
  }, 60000); // le démarrage de PGlite (WebAssembly) peut être lent sous charge

  it('applique toutes les migrations sans erreur (4, 5 et 6 incluses)', () => {
    expect(files).toContain('20261021024859_subscribers_split.sql');
    expect(files).toContain('20261021024955_certifications_awards.sql');
  });

  describe('migration 4 : subscribers / push_subscriptions', () => {
    it('conserve les jetons FCM existants dans push_subscriptions, actifs par défaut', async () => {
      const r = await db.query(
        'select fcm_token, active from public.push_subscriptions order by fcm_token'
      );
      expect(r.rows).toEqual([
        { fcm_token: 'token-A', active: true },
        { fcm_token: 'token-B', active: true },
      ]);
    });

    it('crée la nouvelle table subscribers (courriel) vide, avec deux jetons distincts', async () => {
      await db.exec(`insert into public.subscribers (email) values ('Ada@Example.com')`);
      const r = await db.query(
        'select active, confirmed_at, unsubscribed_at, confirm_token, unsubscribe_token from public.subscribers'
      );
      expect(r.rows).toHaveLength(1);
      const row = r.rows[0];
      expect(row.active).toBe(true);
      expect(row.confirmed_at).toBeNull();
      expect(row.confirm_token).not.toBe(row.unsubscribe_token);
    });

    it('refuse un doublon de courriel, insensible à la casse', async () => {
      await expect(
        db.exec(`insert into public.subscribers (email) values ('ada@example.COM')`)
      ).rejects.toThrow(/duplicate key/i);
    });

    it('active la RLS sur les deux tables', async () => {
      const r = await db.query(`
        select relname, relrowsecurity from pg_class
        where relname in ('subscribers','push_subscriptions','certifications','awards')
          and relnamespace = 'public'::regnamespace order by relname`);
      expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
      expect(r.rows).toHaveLength(4);
    });

    it("n'autorise AUCUNE lecture ni insertion publique (anon) sur subscribers et push_subscriptions", async () => {
      const read = await as('anon', null, () =>
        db.query('select * from public.subscribers')
      );
      expect(read.rows).toHaveLength(0);
      await expect(
        as('anon', null, () =>
          db.exec(`insert into public.subscribers (email) values ('hack@x.com')`)
        )
      ).rejects.toThrow(/row-level security/i);
      await expect(
        as('anon', null, () =>
          db.exec(`insert into public.push_subscriptions (fcm_token) values ('h')`)
        )
      ).rejects.toThrow(/row-level security/i);
    });

    it('un utilisateur simple (non admin) ne voit rien non plus', async () => {
      const r = await as('authenticated', USER, () =>
        db.query('select * from public.push_subscriptions')
      );
      expect(r.rows).toHaveLength(0);
    });

    it("l'admin lit les deux tables", async () => {
      const a = await as('authenticated', ADMIN, () =>
        db.query('select * from public.subscribers')
      );
      const b = await as('authenticated', ADMIN, () =>
        db.query('select * from public.push_subscriptions')
      );
      expect(a.rows).toHaveLength(1);
      expect(b.rows).toHaveLength(2);
    });

    it('nomme proprement les contraintes et la policy de push_subscriptions', async () => {
      const c = await db.query(`
        select conname from pg_constraint
        where conrelid = 'public.push_subscriptions'::regclass order by conname`);
      const names = c.rows.map((r) => r.conname);
      expect(names).toContain('push_subscriptions_pkey');
      expect(names).toContain('push_subscriptions_fcm_token_key');
      const p = await db.query(
        `select policyname from pg_policies where tablename = 'push_subscriptions'`
      );
      expect(p.rows.map((r) => r.policyname)).toEqual(['push_subscriptions_admin']);
    });
  });

  describe('migration 5 : certifications et awards', () => {
    it('crée les tables avec leurs colonnes', async () => {
      const r = await db.query(`
        select table_name, column_name from information_schema.columns
        where table_schema = 'public' and table_name in ('certifications','awards')`);
      const cols = (t) =>
        r.rows.filter((x) => x.table_name === t).map((x) => x.column_name);
      expect(cols('certifications')).toEqual(
        expect.arrayContaining([
          'title',
          'issuer',
          'category',
          'description',
          'issue_date',
          'expiry_date',
          'credential_id',
          'credential_url',
          'image_url',
          'document_url',
          'skills',
          'featured',
          'sort_order',
          'created_at',
        ])
      );
      expect(cols('awards')).toEqual(
        expect.arrayContaining([
          'title',
          'type',
          'organization',
          'description',
          'amount',
          'currency',
          'awarded_at',
          'image_url',
          'document_url',
          'featured',
          'sort_order',
        ])
      );
    });

    it('impose les champs obligatoires et le type de distinction', async () => {
      await expect(
        db.exec(`insert into public.certifications (title, issuer) values ('x','y')`)
      ).rejects.toThrow(/issue_date/);
      await expect(
        db.exec(
          `insert into public.awards (title, organization, awarded_at, type) values ('x','y','2024-01-01','nobel')`
        )
      ).rejects.toThrow(/check constraint/i);
    });

    it('applique les valeurs par défaut (type award, devise CAD, non vedette)', async () => {
      await db.exec(
        `insert into public.awards (title, organization, awarded_at) values ('Prix', 'Org', '2024-05-01')`
      );
      const r = await db.query(
        `select type, currency, featured, sort_order from public.awards`
      );
      expect(r.rows[0]).toEqual({
        type: 'award',
        currency: 'CAD',
        featured: false,
        sort_order: 0,
      });
    });

    it('lecture publique (anon) mais aucune écriture publique', async () => {
      await db.exec(
        `insert into public.certifications (title, issuer, issue_date) values ('AWS', 'Amazon', '2024-01-01')`
      );
      const r = await as('anon', null, () =>
        db.query('select * from public.certifications')
      );
      expect(r.rows).toHaveLength(1);
      const a = await as('anon', null, () => db.query('select * from public.awards'));
      expect(a.rows).toHaveLength(1);
      await expect(
        as('anon', null, () =>
          db.exec(
            `insert into public.certifications (title, issuer, issue_date) values ('f','f','2024-01-01')`
          )
        )
      ).rejects.toThrow(/row-level security/i);
      // UPDATE / DELETE : aucune ligne visible pour la modification -> 0 ligne touchée
      const up = await as('anon', null, () =>
        db.query(`update public.awards set title = 'pirate' returning id`)
      );
      expect(up.rows).toHaveLength(0);
      const del = await as('anon', null, () =>
        db.query(`delete from public.certifications returning id`)
      );
      expect(del.rows).toHaveLength(0);
    });

    it('un utilisateur non admin ne peut pas écrire', async () => {
      await expect(
        as('authenticated', USER, () =>
          db.exec(
            `insert into public.awards (title, organization, awarded_at) values ('u','u','2024-01-01')`
          )
        )
      ).rejects.toThrow(/row-level security/i);
    });

    it("l'admin peut créer, modifier et supprimer", async () => {
      await as('authenticated', ADMIN, async () => {
        await db.exec(
          `insert into public.certifications (title, issuer, issue_date) values ('Azure', 'Microsoft', '2025-02-02')`
        );
        const up = await db.query(
          `update public.certifications set featured = true where title = 'Azure' returning featured`
        );
        expect(up.rows[0].featured).toBe(true);
        const del = await db.query(
          `delete from public.certifications where title = 'Azure' returning id`
        );
        expect(del.rows).toHaveLength(1);
      });
    });
  });

  describe('Storage : bucket documents', () => {
    it('crée le bucket public « documents »', async () => {
      const r = await db.query(
        `select id, public from storage.buckets where id = 'documents'`
      );
      expect(r.rows).toEqual([{ id: 'documents', public: true }]);
    });

    it("l'écriture dans « documents » est réservée à l'admin", async () => {
      await expect(
        as('authenticated', USER, () =>
          db.exec(
            `insert into storage.objects (bucket_id, name) values ('documents', 'a.pdf')`
          )
        )
      ).rejects.toThrow(/row-level security/i);
      await expect(
        as('anon', null, () =>
          db.exec(
            `insert into storage.objects (bucket_id, name) values ('documents', 'a.pdf')`
          )
        )
      ).rejects.toThrow(/row-level security/i);
      await as('authenticated', ADMIN, () =>
        db.exec(
          `insert into storage.objects (bucket_id, name) values ('documents', 'a.pdf')`
        )
      );
    });

    it('les trois policies documents existent (insert, update, delete)', async () => {
      const r = await db.query(
        `select policyname from pg_policies where tablename = 'objects' and policyname like 'documents_admin_%' order by 1`
      );
      expect(r.rows.map((x) => x.policyname)).toEqual([
        'documents_admin_delete',
        'documents_admin_update',
        'documents_admin_write',
      ]);
    });
  });

  describe('migration 6 : séries et vidéos', () => {
    const mkSeries = (status = 'published') =>
      db.exec(
        `insert into public.video_series (id, title, slug, status) values ('${SERIES}', 'Série', 'serie-${status}', '${status}') on conflict do nothing`
      );
    const mkVideo = (n, o = {}) =>
      db.exec(`insert into public.videos (id, series_id, title, slug, video_key, duration_seconds, position, status)
        values ('${V(n)}', '${o.series || SERIES}', 'V${n}', 'v${n}', '${o.key || `videos/serie/0${n}-v${n}.mp4`}', 600, ${n}, '${o.status || 'published'}')`);

    beforeAll(async () => {
      await mkSeries();
      await mkVideo(1);
      await mkVideo(2);
      await mkVideo(3, { status: 'draft' });
    });

    it('crée les deux tables avec RLS active', async () => {
      const r = await db.query(
        `select relname, relrowsecurity from pg_class where relname in ('video_series','videos') and relnamespace = 'public'::regnamespace`
      );
      expect(r.rows).toHaveLength(2);
      expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
    });

    it('valeurs par défaut de la série (niveau, langue, brouillon)', async () => {
      await db.exec(
        `insert into public.video_series (title, slug) values ('Défauts', 'defauts')`
      );
      const r = await db.query(
        `select level, language, status, featured from public.video_series where slug = 'defauts'`
      );
      expect(r.rows[0]).toEqual({
        level: 'beginner',
        language: 'fr',
        status: 'draft',
        featured: false,
      });
    });

    it.each([
      ["une URL complète au lieu d'une clé", 'https://cdn.example/videos/a.mp4'],
      ['un chemin avec ..', 'videos/../secret.mp4'],
      ['une majuscule', 'videos/Serie/01.mp4'],
      ['un autre dossier', 'autre/01.mp4'],
      ['une autre extension', 'videos/serie/01.mov'],
    ])('refuse video_key : %s', async (_n, key) => {
      await expect(mkVideo(9, { key })).rejects.toThrow(/check constraint/i);
    });

    it('refuse un poster hors posters/ et une durée nulle', async () => {
      await expect(
        db.exec(
          `update public.videos set poster_key = 'videos/x.jpg' where id = '${V(1)}'`
        )
      ).rejects.toThrow(/check constraint/i);
      await expect(
        db.exec(`update public.videos set duration_seconds = 0 where id = '${V(1)}'`)
      ).rejects.toThrow(/check constraint/i);
      await db.exec(
        `update public.videos set poster_key = 'posters/serie/01-v1.jpg' where id = '${V(1)}'`
      );
    });

    it('position unique par série (vérifiée à la fin de la transaction)', async () => {
      await expect(
        db.exec(`update public.videos set position = 1 where id = '${V(2)}'`)
      ).rejects.toThrow(/duplicate key|videos_series_position_key/i);
    });

    it("lecture publique : seulement les vidéos publiées d'une série publiée", async () => {
      const v = await as('anon', null, () =>
        db.query('select slug from public.videos order by position')
      );
      expect(v.rows.map((r) => r.slug)).toEqual(['v1', 'v2']);
      const s = await as('anon', null, () =>
        db.query(`select slug from public.video_series where status = 'published'`)
      );
      expect(s.rows.length).toBeGreaterThan(0);
    });

    it('une série en brouillon cache toutes ses vidéos, même publiées', async () => {
      await db.exec(
        `update public.video_series set status = 'draft' where id = '${SERIES}'`
      );
      const v = await as('anon', null, () => db.query('select * from public.videos'));
      expect(v.rows).toHaveLength(0);
      await db.exec(
        `update public.video_series set status = 'published' where id = '${SERIES}'`
      );
    });

    it("aucune écriture publique ; l'admin écrit", async () => {
      await expect(
        as('anon', null, () =>
          db.exec(`insert into public.video_series (title, slug) values ('x','x')`)
        )
      ).rejects.toThrow(/row-level security/i);
      await expect(
        as('authenticated', USER, () =>
          db.exec(
            `insert into public.videos (series_id, title, slug, video_key, duration_seconds) values ('${SERIES}','x','x','videos/a/x.mp4',5)`
          )
        )
      ).rejects.toThrow(/row-level security/i);
      const up = await as('authenticated', ADMIN, () =>
        db.query(
          `update public.videos set title = 'Renommée' where id = '${V(3)}' returning title`
        )
      );
      expect(up.rows[0].title).toBe('Renommée');
    });

    it('supprimer une série supprime ses vidéos (cascade)', async () => {
      await db.exec(
        `insert into public.video_series (id, title, slug) values ('a0000000-0000-4000-8000-0000000000ff', 'Jetable', 'jetable')`
      );
      await mkVideo(8, {
        series: 'a0000000-0000-4000-8000-0000000000ff',
        key: 'videos/jetable/08-v8.mp4',
      });
      await db.exec(`delete from public.video_series where slug = 'jetable'`);
      const r = await db.query(`select 1 from public.videos where id = '${V(8)}'`);
      expect(r.rows).toHaveLength(0);
    });

    it('increment_video_views : réservé au serveur (refusé à anon et authenticated)', async () => {
      await expect(
        as('anon', null, () => db.query(`select public.increment_video_views('${V(1)}')`))
      ).rejects.toThrow(/permission denied/i);
      await expect(
        as('authenticated', ADMIN, () =>
          db.query(`select public.increment_video_views('${V(1)}')`)
        )
      ).rejects.toThrow(/permission denied/i);
    });

    it('increment_video_views : compte les vidéos publiées seulement', async () => {
      await db.exec(
        `select public.increment_video_views('${V(1)}'); select public.increment_video_views('${V(1)}'); select public.increment_video_views('${V(3)}');`
      );
      const r = await db.query(
        `select id, views from public.videos where id in ('${V(1)}','${V(3)}') order by id`
      );
      expect(r.rows.map((x) => x.views)).toEqual([2, 0]);
    });

    it('reorder_videos : échange atomique des positions', async () => {
      await db.exec(
        `select public.reorder_videos('${SERIES}', array['${V(2)}','${V(3)}','${V(1)}']::uuid[])`
      );
      const r = await db.query(
        `select slug, position from public.videos where series_id = '${SERIES}' order by position`
      );
      expect(r.rows).toEqual([
        { slug: 'v2', position: 1 },
        { slug: 'v3', position: 2 },
        { slug: 'v1', position: 3 },
      ]);
    });

    it.each([
      ['une vidéo manquante', () => [V(1), V(2)]],
      ['un doublon', () => [V(1), V(1), V(2)]],
      ['une vidéo étrangère', () => [V(1), V(2), 'c0000000-0000-4000-8000-000000000009']],
    ])('reorder_videos refuse %s, sans rien modifier', async (_n, ids) => {
      const before = (
        await db.query(
          `select id, position from public.videos where series_id = '${SERIES}' order by id`
        )
      ).rows;
      await expect(
        db.exec(
          `select public.reorder_videos('${SERIES}', array[${ids()
            .map((i) => `'${i}'`)
            .join(',')}]::uuid[])`
        )
      ).rejects.toThrow(/Ordre invalide/);
      const after = (
        await db.query(
          `select id, position from public.videos where series_id = '${SERIES}' order by id`
        )
      ).rows;
      expect(after).toEqual(before);
    });

    it('reorder_videos : réservé au serveur', async () => {
      await expect(
        as('authenticated', ADMIN, () =>
          db.query(`select public.reorder_videos('${SERIES}', array['${V(1)}']::uuid[])`)
        )
      ).rejects.toThrow(/permission denied/i);
    });
  });

  describe('migration 7 : projets, compétences, journal des vues', () => {
    const ART = 'd0000000-0000-4000-8000-000000000001';
    const DRAFT = 'd0000000-0000-4000-8000-000000000002';
    beforeAll(async () => {
      await db.exec(`
        insert into public.articles (id, title, slug, status, published_at)
          values ('${ART}', 'Publié', 'publie', 'published', now()),
                 ('${DRAFT}', 'Brouillon', 'brouillon', 'draft', null);
      `);
    });

    it('projets : slug obligatoire et unique, couleur #RRGGBB', async () => {
      await db.exec(
        `insert into public.projects (title, slug, color) values ('EcoTrack', 'ecotrack', '#0f5e4d')`
      );
      await expect(
        db.exec(`insert into public.projects (title, slug) values ('Autre', 'ecotrack')`)
      ).rejects.toThrow(/duplicate key|unique/i);
      await expect(
        db.exec(`insert into public.projects (title) values ('Sans slug')`)
      ).rejects.toThrow(/null value/i);
      await expect(
        db.exec(
          `insert into public.projects (title, slug, color) values ('X', 'x', 'rouge')`
        )
      ).rejects.toThrow(/projects_color_check/);
    });

    it('compétences : ordre d’affichage par défaut à 0', async () => {
      const r = await db.query(
        `insert into public.skills (name, level) values ('React', 90) returning sort_order`
      );
      expect(r.rows[0].sort_order).toBe(0);
    });

    it('increment_views journalise seulement les vues d’articles publiés', async () => {
      await db.exec(
        `select public.increment_views('${ART}'); select public.increment_views('${ART}'); select public.increment_views('${DRAFT}');`
      );
      const views = await db.query(
        `select article_id, count(*)::int as n from public.article_views group by article_id`
      );
      expect(views.rows).toEqual([{ article_id: ART, n: 2 }]);
      const a = await db.query(`select views from public.articles where id = '${ART}'`);
      expect(a.rows[0].views).toBe(2);
    });

    it('article_views_by_month : 12 mois, le mois courant compte les vues', async () => {
      const r = await db.query(
        `select month, views from public.article_views_by_month()`
      );
      expect(r.rows).toHaveLength(12);
      expect(Number(r.rows.at(-1).views)).toBe(2);
      expect(Number(r.rows[0].views)).toBe(0);
    });

    it('journal des vues et statistiques : invisibles et inaccessibles avec la clé publique', async () => {
      const rows = await as('anon', null, () =>
        db.query(`select * from public.article_views`)
      );
      expect(rows.rows).toHaveLength(0);
      await expect(
        as('anon', null, () => db.query(`select * from public.article_views_by_month()`))
      ).rejects.toThrow(/permission denied/i);
      await expect(
        as('authenticated', ADMIN, () =>
          db.query(`select public.increment_views('${ART}')`)
        )
      ).rejects.toThrow(/permission denied/i);
    });
  });
});
