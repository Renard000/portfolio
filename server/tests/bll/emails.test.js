import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/web/app.js';
import AuthService from '../../src/bll/services/AuthService.js';
import EmailTemplateService from '../../src/bll/services/EmailTemplateService.js';
import MessageService from '../../src/bll/services/MessageService.js';
import NewsletterService from '../../src/bll/services/NewsletterService.js';
import PublicationFeedService from '../../src/bll/services/PublicationFeedService.js';
import PublicationSubject from '../../src/bll/events/PublicationSubject.js';
import FeedPublicationObserver from '../../src/bll/events/FeedPublicationObserver.js';
import EmailAdminController from '../../src/web/controllers/EmailAdminController.js';
import PublicationController from '../../src/web/controllers/PublicationController.js';
import NewsletterController from '../../src/web/controllers/NewsletterController.js';
import PushSubscriptionService from '../../src/bll/services/PushSubscriptionService.js';
import Publication from '../../src/domain/entities/Publication.js';
import Message from '../../src/domain/entities/Message.js';
import { renderEmail, contentEmail, fill } from '../../src/bll/emails.js';
import { DEFAULT_TEMPLATES } from '../../src/bll/emailTemplates.js';
import { MemoryNewsletterRepo, MemoryPushRepo } from '../helpers/fakes.js';

const ADMIN = { Authorization: 'Bearer admin-jwt' };
const MSG = '11111111-1111-4111-8111-111111111111';
const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const sender = { name: 'Flo', address: '1 rue X', site: 'https://site.ex' };

class MemoryTemplateRepo {
  items = new Map();
  async list() {
    return [...this.items.values()];
  }
  async findByKey(key) {
    return this.items.get(key) || null;
  }
  async upsert(key, dto) {
    const t = { key, ...dto };
    this.items.set(key, t);
    return t;
  }
  async delete(key) {
    this.items.delete(key);
  }
}

describe('Rendu des courriels', () => {
  it('fournit HTML, texte brut et aucun script', () => {
    const mail = renderEmail(
      DEFAULT_TEMPLATES.article,
      { titre: '<script>x</script>', extrait: 'Résumé' },
      { sender, url: 'https://site.ex/blog/a' }
    );
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.text).toContain('Lire l’article : https://site.ex/blog/a');
    expect(mail.text).toContain('Flo · 1 rue X · https://site.ex');
  });

  it('courriel d’abonnés : désinscription en un clic dans les en-têtes', () => {
    const mail = contentEmail({
      kind: 'video',
      title: 'T',
      url: 'https://site.ex/v',
      unsubscribeUrl: 'https://api.ex/u?token=1',
      sender,
    });
    expect(mail.headers).toEqual({
      'List-Unsubscribe': '<https://api.ex/u?token=1>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it('variable inconnue ou vide : aucun reste {{...}}', () => {
    expect(fill('A {{titre}} {{inconnue}} B', { titre: 'x' })).toBe('A x  B');
    const mail = renderEmail(DEFAULT_TEMPLATES.article, { titre: 'T' }, {});
    expect(mail.html).not.toContain('{{');
    expect(mail.text).not.toContain('{{');
  });

  it('modèle sans bouton : pas de lien d’action', () => {
    const mail = renderEmail(
      { ...DEFAULT_TEMPLATES.reply, ctaLabel: null },
      {},
      { sender }
    );
    expect(mail.html).not.toContain('border-radius:8px;background');
  });
});

describe('Fil des publications et retrait', () => {
  it('l’observateur écrit le fil puis retire le contenu dépublié', async () => {
    const repo = { record: vi.fn(), remove: vi.fn() };
    const subject = new PublicationSubject({ logger: { log() {}, error() {} } });
    subject.subscribe(new FeedPublicationObserver(repo));
    const p = Publication.fromArticle({ id: '1', title: 'T', slug: 't' });
    await subject.notify(p);
    expect(repo.record).toHaveBeenCalledWith(p);
    await subject.retract({ kind: 'article', id: '1' });
    expect(repo.remove).toHaveBeenCalledWith({ kind: 'article', id: '1' });
  });

  it('retract ne rejette jamais et ignore les observateurs sans retrait', async () => {
    const logger = { log() {}, error: vi.fn() };
    const subject = new PublicationSubject({ logger });
    subject.subscribe({ channel: 'email', onPublication: vi.fn() });
    subject.subscribe({
      channel: 'feed',
      onPublication: vi.fn(),
      onRetraction: vi.fn().mockRejectedValue(new Error('x')),
    });
    await expect(subject.retract({ kind: 'article', id: '1' })).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('ne garde que les 14 derniers jours', async () => {
    const repo = { listSince: vi.fn().mockResolvedValue([]) };
    await new PublicationFeedService(repo, () => new Date('2026-10-30T00:00:00Z')).list();
    expect(repo.listSince).toHaveBeenCalledWith('2026-10-16T00:00:00.000Z', 30);
  });
});

describe('API courriels (admin)', () => {
  let app, email, messages, news, templates;

  beforeEach(() => {
    email = { send: vi.fn().mockResolvedValue(undefined) };
    templates = new MemoryTemplateRepo();
    const templateService = new EmailTemplateService(templates, email, { sender });
    messages = {
      item: new Message({
        id: MSG,
        nom: 'Grace',
        email: 'grace@ex.com',
        sujet: 'Mandat',
        message: 'Bonjour <b>vous</b>',
      }),
      findById: vi.fn(async (id) => (id === MSG ? messages.item : null)),
      markReplied: vi.fn(async (id, at) => ({
        ...messages.item,
        lu: true,
        repliedAt: at,
      })),
    };
    const messageService = new MessageService(messages, {
      emailClient: email,
      templates: templateService,
      sender,
      replyTo: 'moi@ex.com',
    });
    news = new MemoryNewsletterRepo();
    const newsletterService = new NewsletterService(news, email, {
      publicApiUrl: 'https://api.ex',
      sender,
      templates: templateService,
    });
    app = createApp(
      {
        authService: new AuthService({
          getUserFromToken: async (t) => (t === 'admin-jwt' ? { id: 'a' } : null),
          getRole: async () => 'admin',
        }),
        certificationController: {},
        awardController: {},
        newsletterController: new NewsletterController(
          newsletterService,
          new PushSubscriptionService(new MemoryPushRepo())
        ),
        subscriberAdminController: {},
        contactController: {},
        videoController: {},
        videoAdminController: {},
        publicationController: new PublicationController({
          list: async () => [{ id: 'p1', kind: 'article', path: '/blog/a' }],
        }),
        emailAdminController: new EmailAdminController({
          emailTemplateService: templateService,
          messageService,
          newsletterService,
        }),
      },
      { clientOrigin: 'http://localhost:9000' }
    );
  });

  const dto = {
    subject: 'Sujet {{titre}}',
    heading: 'Titre',
    body: 'Bonjour',
    ctaLabel: 'Voir',
  };

  it('fil public sans authentification', async () => {
    const res = await request(app).get('/api/publications');
    expect(res.status).toBe(200);
    expect(res.body[0].kind).toBe('article');
  });

  it('accès réservé à l’admin', async () => {
    expect((await request(app).get('/api/admin/email-templates')).status).toBe(401);
    expect(
      (await request(app).post('/api/admin/newsletter/broadcast').send(dto)).status
    ).toBe(401);
  });

  it('liste, modification, retour au modèle par défaut', async () => {
    const list = await request(app).get('/api/admin/email-templates').set(ADMIN);
    expect(list.body.map((t) => t.key)).toContain('certification');
    expect(list.body.every((t) => !t.customized)).toBe(true);
    await request(app).put('/api/admin/email-templates/video').set(ADMIN).send(dto);
    const after = await request(app).get('/api/admin/email-templates').set(ADMIN);
    const video = after.body.find((t) => t.key === 'video');
    expect(video).toMatchObject({ subject: 'Sujet {{titre}}', customized: true });
    const reset = await request(app)
      .delete('/api/admin/email-templates/video')
      .set(ADMIN);
    expect(reset.body.customized).toBe(false);
    expect(
      (await request(app).put('/api/admin/email-templates/inconnu').set(ADMIN).send(dto))
        .status
    ).toBe(400);
  });

  it('aperçu avec données d’exemple, sans rien envoyer', async () => {
    const res = await request(app)
      .post('/api/admin/email-templates/article/preview')
      .set(ADMIN)
      .send(dto);
    expect(res.body.subject).toBe('Sujet Titre de la publication');
    expect(res.body.html).toContain('Bonjour');
    expect(email.send).not.toHaveBeenCalled();
  });

  it('courriel de test marqué comme tel', async () => {
    await request(app)
      .post('/api/admin/email-templates/award/test')
      .set(ADMIN)
      .send({ ...dto, to: 'moi@ex.com' });
    expect(email.send.mock.calls[0][0]).toMatchObject({ to: 'moi@ex.com' });
    expect(email.send.mock.calls[0][0].subject).toMatch(/^\[Test\]/);
  });

  it('réponse : brouillon, envoi avec Reply-To, message cité échappé', async () => {
    const draft = await request(app).get(`/api/admin/messages/${MSG}/reply`).set(ADMIN);
    expect(draft.body.subject).toBe('Re : Mandat');
    expect(draft.body.body).toContain('Bonjour Grace');
    const res = await request(app)
      .post(`/api/admin/messages/${MSG}/reply`)
      .set(ADMIN)
      .send({ subject: 'Re : Mandat', body: 'Merci, parlons-en.' });
    expect(res.body.repliedAt).toBeTruthy();
    const mail = email.send.mock.calls[0][0];
    expect(mail).toMatchObject({ to: 'grace@ex.com', replyTo: 'moi@ex.com' });
    expect(mail.html).toContain('Merci, parlons-en.');
    expect(mail.html).toContain('&lt;b&gt;vous&lt;/b&gt;');
    expect(
      (
        await request(app)
          .post(`/api/admin/messages/${UNKNOWN}/reply`)
          .set(ADMIN)
          .send({ subject: 'S', body: 'B' })
      ).status
    ).toBe(404);
  });

  it('news : seulement aux abonnés confirmés, avec lien de désinscription', async () => {
    const ok = await news.create('ok@x.com');
    await news.update(ok.id, { confirmedAt: '2026-01-01T00:00:00Z' });
    await news.create('pending@x.com');
    const res = await request(app)
      .post('/api/admin/newsletter/broadcast')
      .set(ADMIN)
      .send({ ...dto, ctaUrl: 'https://site.ex/blog' });
    expect(res.body).toEqual({ sent: 1, failed: 0 });
    const mail = email.send.mock.calls[0][0];
    expect(mail.to).toBe('ok@x.com');
    expect(mail.headers['List-Unsubscribe']).toContain(ok.unsubscribeToken);
  });

  it('désinscription en un clic (POST)', async () => {
    const s = await news.create('ok@x.com');
    const res = await request(app).post(
      `/api/newsletter/unsubscribe?token=${s.unsubscribeToken}`
    );
    expect(res.status).toBe(200);
    expect(news.items[0].unsubscribedAt).toBeTruthy();
  });
});
