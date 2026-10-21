import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/web/app.js';
import CertificationService from '../src/bll/services/CertificationService.js';
import AwardService from '../src/bll/services/AwardService.js';
import NewsletterService from '../src/bll/services/NewsletterService.js';
import PushSubscriptionService from '../src/bll/services/PushSubscriptionService.js';
import SubscriberAdminService from '../src/bll/services/SubscriberAdminService.js';
import AuthService from '../src/bll/services/AuthService.js';
import CertificationController from '../src/web/controllers/CertificationController.js';
import AwardController from '../src/web/controllers/AwardController.js';
import NewsletterController from '../src/web/controllers/NewsletterController.js';
import SubscriberAdminController from '../src/web/controllers/SubscriberAdminController.js';
import Certification from '../src/domain/entities/Certification.js';
import Award from '../src/domain/entities/Award.js';
import {
  MemoryCrudRepo,
  MemoryNewsletterRepo,
  MemoryPushRepo,
  makeCert,
  makeAward,
} from './helpers/fakes.js';

const TOKENS = { 'admin-jwt': { id: 'admin-1' }, 'user-jwt': { id: 'user-1' } };
const ROLES = { 'admin-1': 'admin', 'user-1': 'user' };
const ADMIN = { Authorization: 'Bearer admin-jwt' };
const USER = { Authorization: 'Bearer user-jwt' };

let app, certRepo, awardRepo, newsRepo, pushRepo, email;

beforeEach(() => {
  certRepo = new MemoryCrudRepo(Certification, [
    makeCert({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'AWS',
      issuer: 'Amazon',
      featured: true,
      expiryDate: '2000-01-01',
    }),
    makeCert({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Scrum',
      issuer: 'Scrum.org',
      category: 'Gestion',
    }),
  ]);
  awardRepo = new MemoryCrudRepo(Award, [
    makeAward({ id: '33333333-3333-4333-8333-333333333333', amount: 1500 }),
    makeAward({
      id: '44444444-4444-4444-8444-444444444444',
      type: 'merit',
      amount: null,
      awardedAt: '2023-01-01',
    }),
  ]);
  newsRepo = new MemoryNewsletterRepo();
  pushRepo = new MemoryPushRepo();
  email = { send: vi.fn().mockResolvedValue(undefined) };
  const authService = new AuthService({
    getUserFromToken: async (t) => TOKENS[t] || null,
    getRole: async (id) => ROLES[id] || null,
  });
  const newsletterService = new NewsletterService(newsRepo, email, {
    publicApiUrl: 'http://api.test',
  });
  const container = {
    authService,
    certificationController: new CertificationController(
      new CertificationService(certRepo)
    ),
    awardController: new AwardController(new AwardService(awardRepo)),
    newsletterController: new NewsletterController(
      newsletterService,
      new PushSubscriptionService(pushRepo)
    ),
    subscriberAdminController: new SubscriberAdminController(
      new SubscriberAdminService(newsRepo, pushRepo),
      newsletterService
    ),
  };
  app = createApp(container, { clientOrigin: 'http://localhost:9000' });
});

const validCert = { title: 'Nouvelle', issuer: 'Org', issueDate: '2025-01-01' };

describe('GET /api/certifications (public)', () => {
  it('liste avec statut calculé (Expirée / Sans expiration)', async () => {
    const res = await request(app).get('/api/certifications');
    expect(res.status).toBe(200);
    const byTitle = Object.fromEntries(res.body.map((c) => [c.title, c]));
    expect(byTitle.AWS.status).toBe('expired');
    expect(byTitle.Scrum.status).toBe('no-expiry');
    expect(byTitle.AWS).toHaveProperty('issueDate');
  });
  it('filtres issuer, category, q, featured', async () => {
    expect(
      (await request(app).get('/api/certifications?issuer=Amazon')).body
    ).toHaveLength(1);
    expect(
      (await request(app).get('/api/certifications?category=Gestion')).body[0].title
    ).toBe('Scrum');
    expect((await request(app).get('/api/certifications?q=scrum')).body).toHaveLength(1);
    expect(
      (await request(app).get('/api/certifications?featured=true')).body[0].title
    ).toBe('AWS');
  });
  it('tri par date', async () => {
    const res = await request(app).get('/api/certifications?sort=date_asc');
    expect(res.status).toBe(200);
  });
  it('paramètre invalide : 400', async () => {
    expect((await request(app).get('/api/certifications?sort=nimporte')).status).toBe(
      400
    );
  });
});

describe('GET /api/awards (public, avec totaux)', () => {
  it('renvoie items + totaux', async () => {
    const res = await request(app).get('/api/awards');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.totals).toEqual({ count: 2, scholarshipAmounts: { CAD: 1500 } });
    expect(res.body.items[0].year).toBe(2024);
  });
});

describe.each([
  ['certifications', () => certRepo, validCert, { title: 'Modifié' }],
  [
    'awards',
    () => awardRepo,
    { title: 'Prix', organization: 'Org', awardedAt: '2025-01-01' },
    { title: 'Modifié' },
  ],
])('CRUD admin /api/%s', (name, repo, valid, patch) => {
  const url = `/api/${name}`;
  it('sans jeton : 401 ; jeton invalide : 401', async () => {
    expect((await request(app).post(url).send(valid)).status).toBe(401);
    expect(
      (await request(app).post(url).set('Authorization', 'Bearer faux').send(valid))
        .status
    ).toBe(401);
    expect(
      (await request(app).post(url).set('Authorization', 'Basic abc').send(valid)).status
    ).toBe(401);
  });
  it('utilisateur non admin : 403 sur POST, PUT et DELETE', async () => {
    const id = repo().items[0].id;
    expect((await request(app).post(url).set(USER).send(valid)).status).toBe(403);
    expect((await request(app).put(`${url}/${id}`).set(USER).send(patch)).status).toBe(
      403
    );
    expect((await request(app).delete(`${url}/${id}`).set(USER)).status).toBe(403);
    expect(repo().items).toHaveLength(2);
  });
  it('admin : crée (201), modifie (200), supprime (204)', async () => {
    const created = await request(app).post(url).set(ADMIN).send(valid);
    expect(created.status).toBe(201);
    expect(repo().items).toHaveLength(3);
    const upd = await request(app)
      .put(`${url}/${created.body.id}`)
      .set(ADMIN)
      .send(patch);
    expect(upd.status).toBe(200);
    expect(upd.body.title).toBe('Modifié');
    expect(
      (await request(app).delete(`${url}/${created.body.id}`).set(ADMIN)).status
    ).toBe(204);
    expect(repo().items).toHaveLength(2);
  });
  it('id inconnu : 404 ; id mal formé : 400', async () => {
    const ghost = '99999999-9999-4999-8999-999999999999';
    expect(
      (await request(app).put(`${url}/${ghost}`).set(ADMIN).send(patch)).status
    ).toBe(404);
    expect((await request(app).delete(`${url}/${ghost}`).set(ADMIN)).status).toBe(404);
    expect((await request(app).delete(`${url}/pas-un-uuid`).set(ADMIN)).status).toBe(400);
  });
  it('corps invalide : 400 avec détails ; champ inconnu ignoré', async () => {
    const res = await request(app).post(url).set(ADMIN).send({});
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
    const ok = await request(app)
      .post(url)
      .set(ADMIN)
      .send({ ...valid, id: 'forge', role: 'admin' });
    expect(ok.status).toBe(201);
    expect(ok.body.id).not.toBe('forge');
    expect(ok.body.role).toBeUndefined();
  });
});

describe('validation fine des certifications et distinctions', () => {
  const post = (url, body) => request(app).post(url).set(ADMIN).send(body);
  it('refuse une date impossible ou mal formatée', async () => {
    expect(
      (await post('/api/certifications', { ...validCert, issueDate: '2025-02-30' }))
        .status
    ).toBe(400);
    expect(
      (await post('/api/certifications', { ...validCert, issueDate: '01/02/2025' }))
        .status
    ).toBe(400);
  });
  it("refuse une expiration antérieure à l'obtention", async () => {
    const r = await post('/api/certifications', {
      ...validCert,
      expiryDate: '2020-01-01',
    });
    expect(r.status).toBe(400);
    expect(r.body.details[0].path).toBe('expiryDate');
  });
  it('refuse les URL non http(s) (javascript:, data:)', async () => {
    expect(
      (
        await post('/api/certifications', {
          ...validCert,
          credentialUrl: 'javascript:alert(1)',
        })
      ).status
    ).toBe(400);
    expect(
      (await post('/api/certifications', { ...validCert, imageUrl: 'data:text/html,x' }))
        .status
    ).toBe(400);
    expect(
      (
        await post('/api/certifications', {
          ...validCert,
          credentialUrl: 'https://verif.example/ABC',
        })
      ).status
    ).toBe(201);
  });
  it('titre vide ou trop long : 400', async () => {
    expect(
      (await post('/api/certifications', { ...validCert, title: '   ' })).status
    ).toBe(400);
    expect(
      (await post('/api/certifications', { ...validCert, title: 'x'.repeat(201) })).status
    ).toBe(400);
  });
  it('PUT sans aucun champ : 400', async () => {
    const id = certRepo.items[0].id;
    expect(
      (await request(app).put(`/api/certifications/${id}`).set(ADMIN).send({})).status
    ).toBe(400);
  });
  it('distinction : type, montant et devise contrôlés', async () => {
    const base = { title: 'P', organization: 'O', awardedAt: '2025-01-01' };
    expect((await post('/api/awards', { ...base, type: 'nobel' })).status).toBe(400);
    expect((await post('/api/awards', { ...base, amount: -5 })).status).toBe(400);
    expect((await post('/api/awards', { ...base, currency: 'dollars' })).status).toBe(
      400
    );
    const ok = await post('/api/awards', {
      ...base,
      type: 'scholarship',
      amount: 2000,
      currency: 'cad',
    });
    expect(ok.status).toBe(201);
    expect(ok.body.currency).toBe('CAD');
  });
  it('JSON mal formé : 400 sans fuite', async () => {
    const r = await request(app)
      .post('/api/certifications')
      .set(ADMIN)
      .set('Content-Type', 'application/json')
      .send('{oops');
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ error: 'Requête invalide' });
  });
});

describe('Newsletter (double opt-in)', () => {
  const sub = (body) => request(app).post('/api/newsletter/subscribe').send(body);

  it('inscription valide : 202, courriel de confirmation, ligne non confirmée', async () => {
    const res = await sub({ email: 'Ada@Ex.com', consent: true });
    expect(res.status).toBe(202);
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(newsRepo.items[0]).toMatchObject({ email: 'ada@ex.com', confirmedAt: null });
  });
  it('sans consentement explicite : 400, rien écrit', async () => {
    expect((await sub({ email: 'a@b.co' })).status).toBe(400);
    expect((await sub({ email: 'a@b.co', consent: false })).status).toBe(400);
    expect(newsRepo.items).toHaveLength(0);
  });
  it('courriel invalide : 400', async () => {
    expect((await sub({ email: 'pas-un-courriel', consent: true })).status).toBe(400);
  });
  it('honeypot : réponse identique, aucun effet', async () => {
    const res = await sub({ email: 'bot@x.com', consent: true, website: 'spam' });
    expect(res.status).toBe(202);
    expect(newsRepo.items).toHaveLength(0);
    expect(email.send).not.toHaveBeenCalled();
  });
  it('limitation de fréquence : la 6e demande est refusée (429)', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await sub({ email: `u${i}@x.com`, consent: true })).status);
    expect(statuses.slice(0, 5)).toEqual([202, 202, 202, 202, 202]);
    expect(statuses[5]).toBe(429);
  });
  it('confirmation par jeton (GET) : 200 HTML, abonné confirmé', async () => {
    await sub({ email: 'a@b.co', consent: true });
    const s = newsRepo.items[0];
    const res = await request(app).get(`/api/newsletter/confirm?token=${s.confirmToken}`);
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(s.canReceive()).toBe(true);
  });
  it('confirmation : jeton inconnu 404, mal formé 400, absent 400', async () => {
    expect(
      (
        await request(app).get(
          '/api/newsletter/confirm?token=00000000-0000-4000-8000-00000000ffff'
        )
      ).status
    ).toBe(404);
    expect((await request(app).get('/api/newsletter/confirm?token=abc')).status).toBe(
      400
    );
    expect((await request(app).get('/api/newsletter/confirm')).status).toBe(400);
  });
  it('désinscription par jeton, sans connexion', async () => {
    await sub({ email: 'a@b.co', consent: true });
    const s = newsRepo.items[0];
    await request(app).get(`/api/newsletter/confirm?token=${s.confirmToken}`);
    const res = await request(app).get(
      `/api/newsletter/unsubscribe?token=${s.unsubscribeToken}`
    );
    expect(res.status).toBe(200);
    expect(s).toMatchObject({ active: false });
    expect(s.unsubscribedAt).toBeTruthy();
  });
  it("l'id de l'abonné ne sert pas de jeton", async () => {
    await sub({ email: 'a@b.co', consent: true });
    const s = newsRepo.items[0];
    expect(
      (await request(app).get(`/api/newsletter/unsubscribe?token=${s.id}`)).status
    ).toBe(404);
    expect(s.active).toBe(true);
  });
});

describe('Push FCM', () => {
  const tok = 'fcm-token-' + 'x'.repeat(40);
  it('enregistre un jeton (201), sans doublon', async () => {
    expect(
      (await request(app).post('/api/push/subscribe').send({ token: tok })).status
    ).toBe(201);
    expect(
      (await request(app).post('/api/push/subscribe').send({ token: tok })).status
    ).toBe(201);
    expect(pushRepo.items).toHaveLength(1);
  });
  it('jeton absent ou trop court : 400', async () => {
    expect((await request(app).post('/api/push/subscribe').send({})).status).toBe(400);
    expect(
      (await request(app).post('/api/push/subscribe').send({ token: 'court' })).status
    ).toBe(400);
  });
  it('limitation : la 21e demande est refusée', async () => {
    let last;
    for (let i = 0; i < 21; i++)
      last = await request(app)
        .post('/api/push/subscribe')
        .send({ token: tok + i });
    expect(last.status).toBe(429);
  });
});

describe('Admin : abonnés', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'a@b.co', consent: true });
    await request(app)
      .post('/api/push/subscribe')
      .send({ token: 'fcm-token-' + 'y'.repeat(40) });
  });
  it("liste réservée à l'admin (401 / 403 / 200)", async () => {
    expect((await request(app).get('/api/admin/subscribers')).status).toBe(401);
    expect((await request(app).get('/api/admin/subscribers').set(USER)).status).toBe(403);
    const res = await request(app).get('/api/admin/subscribers').set(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.newsletter).toHaveLength(1);
    expect(res.body.push).toHaveLength(1);
  });
  it('ne divulgue ni jetons de confirmation/désinscription ni jeton FCM complet', async () => {
    const raw = (await request(app).get('/api/admin/subscribers').set(ADMIN)).text;
    expect(raw).not.toContain(newsRepo.items[0].confirmToken);
    expect(raw).not.toContain(newsRepo.items[0].unsubscribeToken);
    expect(raw).not.toContain('y'.repeat(40));
  });
  it('suppression par type (204), 404 si absent', async () => {
    const nid = newsRepo.items[0].id;
    const pid = pushRepo.items[0].id;
    expect(
      (await request(app).delete(`/api/admin/subscribers/newsletter/${nid}`).set(USER))
        .status
    ).toBe(403);
    expect(
      (await request(app).delete(`/api/admin/subscribers/newsletter/${nid}`).set(ADMIN))
        .status
    ).toBe(204);
    expect(
      (await request(app).delete(`/api/admin/subscribers/push/${pid}`).set(ADMIN)).status
    ).toBe(204);
    expect(
      (await request(app).delete(`/api/admin/subscribers/push/${pid}`).set(ADMIN)).status
    ).toBe(404);
  });
  it('courriel de test : admin seulement, adresse validée', async () => {
    email.send.mockClear();
    expect(
      (await request(app).post('/api/admin/newsletter/test-email').send({ to: 'a@b.co' }))
        .status
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/admin/newsletter/test-email')
          .set(ADMIN)
          .send({ to: 'nope' })
      ).status
    ).toBe(400);
    const ok = await request(app)
      .post('/api/admin/newsletter/test-email')
      .set(ADMIN)
      .send({ to: 'me@x.co' });
    expect(ok.status).toBe(200);
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(email.send.mock.calls[0][0].to).toBe('me@x.co');
  });
});

describe('Erreurs internes', () => {
  it('500 générique, sans détail interne', async () => {
    certRepo.list = async () => {
      throw new Error('mot de passe db: secret');
    };
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/certifications');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erreur interne' });
    quiet.mockRestore();
  });
});
