import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationService from '../../src/bll/services/NotificationService';
import ArticleService from '../../src/bll/services/ArticleService.js';
import PushSubscriptionService from '../../src/bll/services/PushSubscriptionService.js';
import SubscriberAdminService from '../../src/bll/services/SubscriberAdminService.js';
import AuthService from '../../src/bll/services/AuthService.js';
import Article from '../../src/domain/entities/Article.js';
import { NotFoundError, UnauthorizedError } from '../../src/domain/errors/index.js';
import { MemoryNewsletterRepo, MemoryPushRepo } from '../helpers/fakes.js';

const logger = { log: vi.fn(), error: vi.fn() };
const article = new Article({
  id: 'art1',
  title: 'Hello <script>x</script> & "co"',
  slug: 'mon article',
  excerpt: '<b>résumé</b>',
  status: 'published',
});
let news, push, email, fcm, service;

async function addReceiver(addr, { confirmed = true, active = true } = {}) {
  const s = await news.create(addr);
  await news.update(s.id, {
    confirmedAt: confirmed ? '2026-01-01T00:00:00Z' : null,
    active,
    unsubscribedAt: active ? null : '2026-02-01T00:00:00Z',
  });
  return s;
}

beforeEach(() => {
  vi.clearAllMocks();
  news = new MemoryNewsletterRepo();
  push = new MemoryPushRepo();
  email = { send: vi.fn().mockResolvedValue(undefined) };
  fcm = {
    sendToTokens: vi
      .fn()
      .mockResolvedValue({ successCount: 0, failureCount: 0, invalidTokens: [] }),
  };
  service = new NotificationService(news, push, email, fcm, {
    siteUrl: 'https://site.ex/',
    publicApiUrl: 'https://api.ex',
    batchSize: 2,
    logger,
  });
});

describe('NotificationService — courriels', () => {
  it("n'écrit qu'aux abonnés confirmés, actifs et non désinscrits", async () => {
    await addReceiver('ok@x.com');
    await addReceiver('pending@x.com', { confirmed: false });
    await addReceiver('gone@x.com', { active: false });
    const r = await service.notifyPublished(article);
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(email.send.mock.calls[0][0].to).toBe('ok@x.com');
    expect(r.email).toEqual({ sent: 1, failed: 0, deactivated: 0 });
  });

  it("chaque courriel contient le lien de désinscription personnel (jeton) et le lien de l'article", async () => {
    const s = await addReceiver('ok@x.com');
    await service.notifyPublished(article);
    const { html } = email.send.mock.calls[0][0];
    expect(html).toContain(
      `https://api.ex/api/newsletter/unsubscribe?token=${s.unsubscribeToken}`
    );
    expect(html).toContain('https://site.ex/blog/mon%20article');
  });

  it("échappe le HTML du titre et du résumé (pas d'injection)", async () => {
    await addReceiver('ok@x.com');
    await service.notifyPublished(article);
    const { html } = email.send.mock.calls[0][0];
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;résumé&lt;/b&gt;');
  });

  it('envoie par lots (batchSize=2 → 5 abonnés = 3 lots) et compte succès/échecs', async () => {
    for (let i = 0; i < 5; i++) await addReceiver(`u${i}@x.com`);
    let inFlight = 0;
    let maxInFlight = 0;
    email.send.mockImplementation(async ({ to }) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      if (to === 'u3@x.com') throw new Error('boom');
    });
    const r = await service.notifyPublished(article);
    expect(email.send).toHaveBeenCalledTimes(5);
    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(r.email).toEqual({ sent: 4, failed: 1, deactivated: 0 });
  });

  it('journalise les compteurs sans le contenu des courriels', async () => {
    await addReceiver('ok@x.com');
    await service.notifyPublished(article);
    const line = logger.log.mock.calls[0][0];
    expect(line).toContain('1 ok / 0 échecs');
    expect(line).not.toContain('script');
  });
});

describe('NotificationService — push FCM', () => {
  it('envoie aux jetons ACTIFS seulement, avec titre, texte et lien', async () => {
    await push.upsert('tok-active-aaaaaaaaaaaa');
    await push.upsert('tok-off-bbbbbbbbbbbbbbb');
    await push.deactivate(['tok-off-bbbbbbbbbbbbbbb']);
    fcm.sendToTokens.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      invalidTokens: [],
    });
    const r = await service.notifyPublished(article);
    expect(fcm.sendToTokens).toHaveBeenCalledWith(['tok-active-aaaaaaaaaaaa'], {
      title: 'Nouvel article',
      body: article.title,
      url: 'https://site.ex/blog/mon%20article',
    });
    expect(r.push.sent).toBe(1);
  });

  it('désactive les jetons que FCM déclare non enregistrés', async () => {
    await push.upsert('good-token-aaaaaaaaaaaa');
    await push.upsert('dead-token-bbbbbbbbbbbb');
    fcm.sendToTokens.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      invalidTokens: ['dead-token-bbbbbbbbbbbb'],
    });
    const r = await service.notifyPublished(article);
    expect(r.push.deactivated).toBe(1);
    expect((await push.listActive()).map((p) => p.fcmToken)).toEqual([
      'good-token-aaaaaaaaaaaa',
    ]);
  });

  it('découpe en lots de 500 jetons (limite FCM)', async () => {
    for (let i = 0; i < 1001; i++)
      await push.upsert(`token-${String(i).padStart(5, '0')}-xxxxxxxx`);
    fcm.sendToTokens.mockImplementation(async (t) => ({
      successCount: t.length,
      failureCount: 0,
      invalidTokens: [],
    }));
    const r = await service.notifyPublished(article);
    expect(fcm.sendToTokens.mock.calls.map((c) => c[0].length)).toEqual([500, 500, 1]);
    expect(r.push.sent).toBe(1001);
  });

  it("une panne FCM n'empêche pas les courriels (et inversement)", async () => {
    await addReceiver('ok@x.com');
    await push.upsert('tok-aaaaaaaaaaaaaaaaaaaa');
    fcm.sendToTokens.mockRejectedValue(new Error('fcm down'));
    const r = await service.notifyPublished(article);
    expect(r.email.sent).toBe(1);
    expect(r.push.error).toBe(true);
    expect(logger.error).toHaveBeenCalled();

    email.send.mockRejectedValue(new Error('smtp down'));
    fcm.sendToTokens.mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      invalidTokens: [],
    });
    const r2 = await service.notifyPublished(article);
    expect(r2.push.sent).toBe(1);
    expect(r2.email.failed).toBe(1);
  });
});

describe('ArticleService.publish → NotificationService', () => {
  const makeRepo = (a) => ({
    findById: vi.fn().mockResolvedValue(a),
    save: vi.fn(async (x) => x),
  });

  it('publie le brouillon puis notifie', async () => {
    const a = new Article({ id: '1', title: 'T', slug: 't' });
    const notifier = { notifyPublished: vi.fn().mockResolvedValue({}) };
    const result = await new ArticleService(makeRepo(a), notifier).publish('1');
    expect(result.status).toBe('published');
    expect(notifier.notifyPublished).toHaveBeenCalledWith(result);
  });

  it('une panne de notification ne casse pas la publication', async () => {
    const a = new Article({ id: '1', title: 'T', slug: 't' });
    const notifier = { notifyPublished: vi.fn().mockRejectedValue(new Error('x')) };
    const r = await new ArticleService(makeRepo(a), notifier).publish('1');
    expect(r.status).toBe('published');
  });

  it('article inconnu : NotFoundError, aucune notification', async () => {
    const notifier = { notifyPublished: vi.fn() };
    await expect(
      new ArticleService(makeRepo(null), notifier).publish('x')
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(notifier.notifyPublished).not.toHaveBeenCalled();
  });

  it('article déjà publié : refus, aucune notification en double', async () => {
    const a = new Article({ id: '1', title: 'T', slug: 't', status: 'published' });
    const notifier = { notifyPublished: vi.fn() };
    await expect(
      new ArticleService(makeRepo(a), notifier).publish('1')
    ).rejects.toThrow();
    expect(notifier.notifyPublished).not.toHaveBeenCalled();
  });
});

describe('Autres services', () => {
  it('PushSubscriptionService : enregistre puis réactive un jeton existant (pas de doublon)', async () => {
    const p = new MemoryPushRepo();
    const s = new PushSubscriptionService(p);
    await s.subscribe('tok-aaaaaaaaaaaaaaaaaaaa');
    await p.deactivate(['tok-aaaaaaaaaaaaaaaaaaaa']);
    await s.subscribe('tok-aaaaaaaaaaaaaaaaaaaa');
    expect(p.items).toHaveLength(1);
    expect(p.items[0].active).toBe(true);
  });

  it('SubscriberAdminService : liste les deux types, supprime, NotFound si absent', async () => {
    const n = new MemoryNewsletterRepo();
    const p = new MemoryPushRepo();
    const s = new SubscriberAdminService(n, p);
    const a = await n.create('a@b.co');
    const b = await p.upsert('tok-aaaaaaaaaaaaaaaaaaaa');
    const all = await s.listAll();
    expect(all.newsletter).toHaveLength(1);
    expect(all.push).toHaveLength(1);
    await s.removeNewsletter(a.id);
    await s.removePush(b.id);
    await expect(s.removeNewsletter(a.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(s.removePush(b.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('AuthService : jeton absent/invalide → 401 ; rôle admin vérifié', async () => {
    const repo = {
      getUserFromToken: vi.fn(async (t) => (t === 'good' ? { id: 'u1' } : null)),
      getRole: vi.fn(async (id) => (id === 'u1' ? 'admin' : 'user')),
    };
    const s = new AuthService(repo);
    await expect(s.authenticate('')).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(s.authenticate('bad')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(await s.authenticate('good')).toEqual({ id: 'u1' });
    expect(await s.isAdmin('u1')).toBe(true);
    expect(await s.isAdmin('u2')).toBe(false);
  });
});
