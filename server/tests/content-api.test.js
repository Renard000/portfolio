import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/web/app.js';
import AuthService from '../src/bll/services/AuthService.js';
import ArticleService from '../src/bll/services/ArticleService.js';
import CommentService from '../src/bll/services/CommentService.js';
import MessageService from '../src/bll/services/MessageService.js';
import ProjectService from '../src/bll/services/ProjectService.js';
import SkillService from '../src/bll/services/SkillService.js';
import DashboardService from '../src/bll/services/DashboardService.js';
import NewsletterService from '../src/bll/services/NewsletterService.js';
import PushSubscriptionService from '../src/bll/services/PushSubscriptionService.js';
import ArticleController from '../src/web/controllers/ArticleController.js';
import AdminContentController from '../src/web/controllers/AdminContentController.js';
import CrudController from '../src/web/controllers/CrudController.js';
import NewsletterController from '../src/web/controllers/NewsletterController.js';
import Article from '../src/domain/entities/Article.js';
import Comment from '../src/domain/entities/Comment.js';
import Message from '../src/domain/entities/Message.js';
import Project from '../src/domain/entities/Project.js';
import Skill from '../src/domain/entities/Skill.js';
import {
  MemoryCrudRepo,
  MemoryNewsletterRepo,
  MemoryPushRepo,
  uuid,
} from './helpers/fakes.js';

const ADMIN = { Authorization: 'Bearer admin-jwt' };
const USER = { Authorization: 'Bearer user-jwt' };
const A1 = '11111111-1111-4111-8111-111111111111';
const A2 = '22222222-2222-4222-8222-222222222222';
const DRAFT = '33333333-3333-4333-8333-333333333333';
const UNKNOWN = '99999999-9999-4999-8999-999999999999';

/** Faux repository d'articles : mêmes méthodes que ArticleRepository. */
class MemoryArticleRepo extends MemoryCrudRepo {
  constructor(items) {
    super(Article, items);
  }
  #published() {
    return this.items
      .filter((a) => a.isPublished())
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  async listPublished({ category, q, offset = 0, limit = 9 } = {}) {
    let list = this.#published();
    if (category) list = list.filter((a) => a.category === category);
    if (q) list = list.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
    return { items: list.slice(offset, offset + limit), total: list.length };
  }
  async publishedCategories() {
    return [
      ...new Set(
        this.#published()
          .map((a) => a.category)
          .filter(Boolean)
      ),
    ];
  }
  async findPublishedBySlug(slug) {
    return this.#published().find((a) => a.slug === slug) || null;
  }
  async listAll() {
    return [...this.items];
  }
  async create(dto) {
    if (this.items.some((a) => a.slug === dto.slug))
      throw new Error('duplicate key value violates unique constraint');
    return super.create(dto);
  }
  async save(article) {
    return this.update(article.id, {
      status: article.status,
      publishedAt: article.publishedAt,
    });
  }
  async incrementViews(id) {
    const a = await this.findById(id);
    if (a && a.isPublished()) a.views += 1;
  }
  async incrementLikes(id) {
    const a = await this.findById(id);
    if (!a || !a.isPublished()) return null;
    a.likes += 1;
    return a.likes;
  }
}

class MemoryCommentRepo extends MemoryCrudRepo {
  constructor(items) {
    super(Comment, items);
  }
  async listApproved(articleId) {
    return this.items.filter((c) => c.articleId === articleId && c.approved);
  }
  async countApprovedByArticle(ids) {
    return this.items
      .filter((c) => c.approved && ids.includes(c.articleId))
      .reduce((acc, c) => ({ ...acc, [c.articleId]: (acc[c.articleId] || 0) + 1 }), {});
  }
  async listAll() {
    return [...this.items];
  }
  async setApproved(id, approved) {
    return this.update(id, { approved });
  }
}

class MemoryMessageRepo extends MemoryCrudRepo {
  constructor(items) {
    super(Message, items);
  }
  async listAll() {
    return [...this.items];
  }
  async setRead(id, lu) {
    return this.update(id, { lu });
  }
}

const dashboardRepo = {
  counts: async () => ({
    articles: { published: 2, drafts: 1 },
    unreadMessages: 1,
    pendingComments: 1,
    subscribers: { confirmed: 86, newThisWeek: 5 },
  }),
  views30d: async () => ({ current: 1248, previous: 1114 }),
  viewsByMonth: async () => [{ month: '2026-10-01', views: 1248 }],
  topArticles: async () => [{ id: A1, title: 'Premier', slug: 'premier', views: 10 }],
  topVideos: async () => [],
  publishedVideoSeconds: async () => 51600,
};

let app, articleRepo, commentRepo, messageRepo, projectRepo, notifier;

beforeEach(() => {
  articleRepo = new MemoryArticleRepo([
    new Article({
      id: A1,
      title: 'Premier',
      slug: 'premier',
      content: 'Bonjour **monde**',
      category: 'React',
      status: 'published',
      publishedAt: '2026-10-20T10:00:00Z',
    }),
    new Article({
      id: A2,
      title: 'Second',
      slug: 'second',
      content: 'Texte',
      category: 'Node',
      status: 'published',
      publishedAt: '2026-10-22T10:00:00Z',
    }),
    new Article({ id: DRAFT, title: 'Brouillon', slug: 'brouillon', content: 'x' }),
  ]);
  commentRepo = new MemoryCommentRepo([
    new Comment({
      id: uuid(),
      articleId: A1,
      author: 'Ada',
      content: 'Bravo',
      approved: true,
    }),
    new Comment({ id: uuid(), articleId: A1, author: 'Bob', content: 'En attente' }),
  ]);
  messageRepo = new MemoryMessageRepo([
    new Message({
      id: uuid(),
      nom: 'Grace',
      email: 'g@ex.com',
      message: 'Bonjour à vous',
    }),
  ]);
  projectRepo = new MemoryCrudRepo(Project, [
    new Project({ id: uuid(), slug: 'ecotrack', title: 'EcoTrack' }),
  ]);
  notifier = { notify: vi.fn().mockResolvedValue({}) };

  const authService = new AuthService({
    getUserFromToken: async (t) =>
      ({ 'admin-jwt': { id: 'admin-1' }, 'user-jwt': { id: 'user-1' } })[t] || null,
    getRole: async (id) => ({ 'admin-1': 'admin', 'user-1': 'user' })[id] || null,
  });
  const articleService = new ArticleService(articleRepo, notifier, commentRepo);
  const commentService = new CommentService(commentRepo, articleRepo);
  const newsRepo = new MemoryNewsletterRepo();
  const newsletterService = new NewsletterService(
    newsRepo,
    { send: vi.fn() },
    { publicApiUrl: 'http://api.test' }
  );
  const container = {
    authService,
    // Contrôleurs déjà existants : seulement ce dont le routeur a besoin pour démarrer
    certificationController: {},
    awardController: {},
    newsletterController: new NewsletterController(
      newsletterService,
      new PushSubscriptionService(new MemoryPushRepo()),
      { siteUrl: 'http://site.test/' }
    ),
    subscriberAdminController: {},
    contactController: {},
    videoController: {},
    videoAdminController: {},
    articleController: new ArticleController(articleService, commentService),
    projectController: new CrudController(new ProjectService(projectRepo)),
    skillController: new CrudController(new SkillService(new MemoryCrudRepo(Skill))),
    adminContentController: new AdminContentController({
      articleService,
      commentService,
      messageService: new MessageService(messageRepo),
      dashboardService: new DashboardService(dashboardRepo),
    }),
  };
  app = createApp(container, { clientOrigin: 'http://localhost:9000' });
  app.newsRepo = newsRepo;
});

describe('Blog public', () => {
  it('GET /api/articles : publiés seulement, plus récents d’abord, sans texte complet', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.items.map((a) => a.slug)).toEqual(['second', 'premier']);
    expect(res.body.items[0]).not.toHaveProperty('content');
    expect(res.body.items[0].readingMinutes).toBeGreaterThanOrEqual(1);
    expect(res.body.items[1].comments).toBe(1);
    expect(res.body).toMatchObject({ total: 2, page: 1, pages: 1 });
    expect(res.body.categories.sort()).toEqual(['Node', 'React']);
  });

  it('filtres et pagination limitée à 20', async () => {
    const res = await request(app).get('/api/articles?category=React');
    expect(res.body.items).toHaveLength(1);
    expect((await request(app).get('/api/articles?limit=50')).status).toBe(400);
    const p2 = await request(app).get('/api/articles?limit=1&page=2');
    expect(p2.body.items[0].slug).toBe('premier');
    expect(p2.body.pages).toBe(2);
  });

  it('GET /api/articles/:slug : article, commentaires approuvés, à lire ensuite', async () => {
    const res = await request(app).get('/api/articles/premier');
    expect(res.status).toBe(200);
    expect(res.body.article.content).toContain('monde');
    expect(res.body.comments).toEqual([
      expect.objectContaining({ author: 'Ada', content: 'Bravo' }),
    ]);
    expect(res.body.comments[0]).not.toHaveProperty('approved');
    expect(res.body.related.map((a) => a.slug)).toEqual(['second']);
  });

  it('un brouillon est introuvable (404)', async () => {
    expect((await request(app).get('/api/articles/brouillon')).status).toBe(404);
  });

  it('vues et likes : seulement sur un article publié', async () => {
    expect((await request(app).post(`/api/articles/${A1}/view`)).status).toBe(204);
    expect(articleRepo.items[0].views).toBe(1);
    const like = await request(app).post(`/api/articles/${A1}/like`);
    expect(like.body).toEqual({ likes: 1 });
    expect((await request(app).post(`/api/articles/${DRAFT}/like`)).status).toBe(404);
  });

  it('commentaire : 202, enregistré non approuvé ; refusé sur un brouillon', async () => {
    const ok = await request(app)
      .post(`/api/articles/${A1}/comments`)
      .send({ author: 'Linus', content: 'Très clair' });
    expect(ok.status).toBe(202);
    expect(commentRepo.items.at(-1)).toMatchObject({ author: 'Linus', approved: false });
    const draft = await request(app)
      .post(`/api/articles/${DRAFT}/comments`)
      .send({ author: 'X', content: 'Salut' });
    expect(draft.status).toBe(404);
  });

  it('commentaire : honeypot ignoré, corps invalide 400', async () => {
    const before = commentRepo.items.length;
    const bot = await request(app)
      .post(`/api/articles/${A1}/comments`)
      .send({ author: 'Bot', content: 'Spam spam', website: 'http://x' });
    expect(bot.status).toBe(202);
    expect(commentRepo.items).toHaveLength(before);
    const bad = await request(app)
      .post(`/api/articles/${A1}/comments`)
      .send({ author: '' });
    expect(bad.status).toBe(400);
  });
});

describe('Projets et compétences', () => {
  it('lecture publique, écriture admin seulement', async () => {
    expect((await request(app).get('/api/projects')).body).toHaveLength(1);
    const body = { slug: 'finova', title: 'Finova', tech: ['C#'] };
    expect((await request(app).post('/api/projects').send(body)).status).toBe(401);
    expect((await request(app).post('/api/projects').set(USER).send(body)).status).toBe(
      403
    );
    const created = await request(app).post('/api/projects').set(ADMIN).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ slug: 'finova', tech: ['C#'] });
  });

  it('validation : slug, couleur et URL', async () => {
    const bad = await request(app).post('/api/projects').set(ADMIN).send({
      slug: 'Pas Bon',
      title: 'X',
      color: 'rouge',
      liveUrl: 'javascript:alert(1)',
    });
    expect(bad.status).toBe(400);
    expect(bad.body.details.map((d) => d.path).sort()).toEqual([
      'color',
      'liveUrl',
      'slug',
    ]);
  });

  it('CRUD compétences avec niveau 0-100', async () => {
    const c = await request(app)
      .post('/api/skills')
      .set(ADMIN)
      .send({ name: 'React', level: 90 });
    expect(c.status).toBe(201);
    expect(
      (await request(app).post('/api/skills').set(ADMIN).send({ name: 'X', level: 101 }))
        .status
    ).toBe(400);
    const u = await request(app)
      .put(`/api/skills/${c.body.id}`)
      .set(ADMIN)
      .send({ level: 95 });
    expect(u.body.level).toBe(95);
    expect(
      (await request(app).delete(`/api/skills/${c.body.id}`).set(ADMIN)).status
    ).toBe(204);
    expect((await request(app).delete(`/api/skills/${UNKNOWN}`).set(ADMIN)).status).toBe(
      404
    );
  });
});

describe('Admin : articles', () => {
  it('toutes les routes exigent le rôle admin', async () => {
    for (const [method, url] of [
      ['get', '/api/admin/articles'],
      ['get', '/api/admin/dashboard'],
      ['get', '/api/admin/comments'],
      ['get', '/api/admin/messages'],
    ]) {
      expect((await request(app)[method](url)).status).toBe(401);
      expect((await request(app)[method](url).set(USER)).status).toBe(403);
    }
  });

  it('liste brouillons compris ; détail avec le texte complet', async () => {
    const list = await request(app).get('/api/admin/articles').set(ADMIN);
    expect(list.body).toHaveLength(3);
    const one = await request(app).get(`/api/admin/articles/${DRAFT}`).set(ADMIN);
    expect(one.body.content).toBe('x');
  });

  it('création en brouillon, slug unique', async () => {
    const dto = {
      title: 'Nouveau',
      slug: 'nouveau',
      content: '# Titre',
      status: 'published',
    };
    const res = await request(app).post('/api/admin/articles').set(ADMIN).send(dto);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    const dup = await request(app).post('/api/admin/articles').set(ADMIN).send(dto);
    expect(dup.status).toBe(400);
    expect(dup.body.error).toMatch(/slug/);
  });

  it('publier et notifier, puis dépublier', async () => {
    const pub = await request(app)
      .post(`/api/admin/articles/${DRAFT}/publish`)
      .set(ADMIN);
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe('published');
    expect(notifier.notify).toHaveBeenCalledOnce();
    // Déjà publié : 400
    expect(
      (await request(app).post(`/api/admin/articles/${DRAFT}/publish`).set(ADMIN)).status
    ).toBe(400);
    const unpub = await request(app)
      .post(`/api/admin/articles/${DRAFT}/unpublish`)
      .set(ADMIN);
    expect(unpub.body).toMatchObject({ status: 'draft', publishedAt: null });
  });

  it('modification et suppression', async () => {
    const u = await request(app)
      .put(`/api/admin/articles/${A2}`)
      .set(ADMIN)
      .send({ title: 'Second (révisé)' });
    expect(u.body.title).toBe('Second (révisé)');
    expect(
      (await request(app).put(`/api/admin/articles/${A2}`).set(ADMIN).send({})).status
    ).toBe(400);
    expect(
      (await request(app).delete(`/api/admin/articles/${A2}`).set(ADMIN)).status
    ).toBe(204);
    expect(
      (await request(app).delete(`/api/admin/articles/${A2}`).set(ADMIN)).status
    ).toBe(404);
  });
});

describe('Admin : modération et messages', () => {
  it('approuver puis supprimer un commentaire', async () => {
    const list = await request(app).get('/api/admin/comments').set(ADMIN);
    const pending = list.body.find((c) => !c.approved);
    const ok = await request(app)
      .put(`/api/admin/comments/${pending.id}`)
      .set(ADMIN)
      .send({ approved: true });
    expect(ok.body.approved).toBe(true);
    expect(
      (await request(app).delete(`/api/admin/comments/${pending.id}`).set(ADMIN)).status
    ).toBe(204);
    expect(
      (
        await request(app)
          .put(`/api/admin/comments/${UNKNOWN}`)
          .set(ADMIN)
          .send({ approved: true })
      ).status
    ).toBe(404);
  });

  it('marquer un message comme lu', async () => {
    const [msg] = (await request(app).get('/api/admin/messages').set(ADMIN)).body;
    expect(msg.lu).toBe(false);
    const res = await request(app)
      .put(`/api/admin/messages/${msg.id}`)
      .set(ADMIN)
      .send({ lu: true });
    expect(res.body.lu).toBe(true);
    expect(
      (
        await request(app)
          .put(`/api/admin/messages/${msg.id}`)
          .set(ADMIN)
          .send({ lu: 'oui' })
      ).status
    ).toBe(400);
  });
});

describe('Admin : tableau de bord', () => {
  it('agrège les compteurs et calcule la variation des vues', async () => {
    const res = await request(app).get('/api/admin/dashboard').set(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.views).toEqual({ last30Days: 1248, changePct: 12 });
    expect(res.body.subscribers).toEqual({ confirmed: 86, newThisWeek: 5 });
    expect(res.body.publishedVideoSeconds).toBe(51600);
  });

  it('variation nulle sans période précédente', () => {
    expect(DashboardService.change(10, 0)).toBeNull();
    expect(DashboardService.change(50, 100)).toBe(-50);
  });
});

describe('Newsletter : liens des courriels vers les pages du site', () => {
  it('confirmation valide : redirection 303 vers /newsletter/confirmation?statut=ok', async () => {
    await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'ada@ex.com', consent: true });
    const s = app.newsRepo.items[0];
    const res = await request(app).get(`/api/newsletter/confirm?token=${s.confirmToken}`);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe(
      'http://site.test/newsletter/confirmation?statut=ok'
    );
    expect(s.confirmedAt).toBeTruthy();
  });

  it('jeton inconnu : redirection avec statut invalide (aucune donnée dans l’adresse)', async () => {
    const res = await request(app).get(`/api/newsletter/unsubscribe?token=${UNKNOWN}`);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe(
      'http://site.test/newsletter/desinscription?statut=invalide'
    );
  });
});
