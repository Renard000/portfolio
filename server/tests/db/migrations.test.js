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

  it('applique les 7 migrations sans erreur (4 et 5 incluses)', () => {
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
});
