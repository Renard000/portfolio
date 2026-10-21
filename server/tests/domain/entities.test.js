import { describe, it, expect } from 'vitest';
import Certification from '../../src/domain/entities/Certification.js';
import Award from '../../src/domain/entities/Award.js';
import NewsletterSubscriber from '../../src/domain/entities/NewsletterSubscriber.js';
import PushSubscription from '../../src/domain/entities/PushSubscription.js';
import Article from '../../src/domain/entities/Article.js';
import { ValidationError } from '../../src/domain/errors/index.js';

const NOW = new Date('2026-06-15T12:00:00Z');
const cert = (o) =>
  new Certification({ id: '1', title: 't', issuer: 'i', issueDate: '2020-01-01', ...o });

describe('Certification.isExpired / status', () => {
  it("sans date d'expiration : jamais expirée, statut no-expiry", () => {
    const c = cert({});
    expect(c.isExpired(NOW)).toBe(false);
    expect(c.status(NOW)).toBe('no-expiry');
  });
  it('expiration future : valide', () => {
    const c = cert({ expiryDate: '2027-01-01' });
    expect(c.isExpired(NOW)).toBe(false);
    expect(c.status(NOW)).toBe('valid');
  });
  it('expiration passée : expirée', () => {
    const c = cert({ expiryDate: '2025-12-31' });
    expect(c.isExpired(NOW)).toBe(true);
    expect(c.status(NOW)).toBe('expired');
  });
  it('expire le jour même : encore valide (inclusif)', () => {
    expect(cert({ expiryDate: '2026-06-15' }).isExpired(NOW)).toBe(false);
  });
  it('expiré la veille : expirée', () => {
    expect(cert({ expiryDate: '2026-06-14' }).isExpired(NOW)).toBe(true);
  });
  it('toJSON expose le statut et applique les valeurs par défaut', () => {
    const j = cert({ expiryDate: '2000-01-01' }).toJSON();
    expect(j.status).toBe('expired');
    expect(j.skills).toEqual([]);
    expect(j.featured).toBe(false);
  });
});

describe('Award', () => {
  it('convertit le montant en nombre et détecte les bourses', () => {
    const a = new Award({
      id: '1',
      title: 't',
      organization: 'o',
      awardedAt: '2023-09-10',
      type: 'scholarship',
      amount: '2500.50',
    });
    expect(a.amount).toBe(2500.5);
    expect(a.isScholarship()).toBe(true);
    expect(a.hasAmount()).toBe(true);
    expect(a.year).toBe(2023);
    expect(a.toJSON().year).toBe(2023);
  });
  it('sans montant : hasAmount est faux ; devise par défaut CAD', () => {
    const a = new Award({
      id: '1',
      title: 't',
      organization: 'o',
      awardedAt: '2023-09-10',
    });
    expect(a.hasAmount()).toBe(false);
    expect(a.currency).toBe('CAD');
    expect(a.type).toBe('award');
  });
});

describe("NewsletterSubscriber.canReceive (règle d'envoi)", () => {
  const base = { id: '1', email: 'a@b.c', confirmToken: 'c', unsubscribeToken: 'u' };
  it('non confirmé : pas de réception', () => {
    expect(new NewsletterSubscriber(base).canReceive()).toBe(false);
  });
  it('confirmé et actif : reçoit', () => {
    expect(
      new NewsletterSubscriber({ ...base, confirmedAt: '2026-01-01' }).canReceive()
    ).toBe(true);
  });
  it('désinscrit ou inactif : ne reçoit pas', () => {
    expect(
      new NewsletterSubscriber({ ...base, confirmedAt: 'x', active: false }).canReceive()
    ).toBe(false);
    expect(
      new NewsletterSubscriber({
        ...base,
        confirmedAt: 'x',
        unsubscribedAt: 'y',
      }).canReceive()
    ).toBe(false);
  });
  it('toJSON ne divulgue JAMAIS les jetons', () => {
    const j = JSON.stringify(new NewsletterSubscriber({ ...base, confirmedAt: 'x' }));
    expect(j).not.toContain('confirmToken');
    expect(j).not.toContain('unsubscribeToken');
    expect(j).toContain('"confirmed":true');
  });
});

describe('PushSubscription', () => {
  it('masque le jeton FCM dans le JSON', () => {
    const p = new PushSubscription({ id: '1', fcmToken: 'abcdefghijklmnopqrstuvwxyz' });
    const j = JSON.parse(JSON.stringify(p));
    expect(j.token).toBe('abcdef…wxyz');
    expect(JSON.stringify(j)).not.toContain('abcdefghijklmnopqrstuvwxyz');
  });
});

describe('Article.publish', () => {
  it('passe un brouillon en publié avec une date', () => {
    const a = new Article({ id: '1', title: 't', slug: 's' });
    a.publish(NOW);
    expect(a.status).toBe('published');
    expect(a.publishedAt).toBe(NOW.toISOString());
  });
  it('refuse de republier', () => {
    const a = new Article({ id: '1', title: 't', slug: 's', status: 'published' });
    expect(() => a.publish()).toThrow(ValidationError);
  });
});
