import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middlewares/validate.js';
import { authMiddleware, adminOnly } from '../middlewares/auth.js';
import {
  idParams,
  tokenQuery,
  certificationCreate,
  certificationUpdate,
  certificationQuery,
  awardCreate,
  awardUpdate,
  newsletterSubscribeBody,
  pushSubscribeBody,
  contactBody,
  seriesQuery,
  slugParams,
  slugsParams,
  seriesCreate,
  seriesUpdate,
  videoCreate,
  videoUpdate,
  orderBody,
  uploadUrlBody,
  testEmailBody,
  articleQuery,
  articleCreate,
  articleUpdate,
  commentBody,
  approveBody,
  readBody,
  projectCreate,
  projectUpdate,
  skillCreate,
  skillUpdate,
  templateParams,
  templateBody,
  templateTestBody,
  replyBody,
  broadcastBody,
} from '../../bll/schemas/index.js';

const HOUR = 60 * 60 * 1000;
const limiter = (limit, windowMs = HOUR) =>
  rateLimit({
    windowMs,
    limit,
    message: { error: 'Trop de requêtes, réessayez plus tard' },
  });

/** Enveloppe un contrôleur : (req,res) → méthode du contrôleur. */
const h = (controller, method) => (req, res) => controller[method](req, res);

export function buildApiRouter(container) {
  const {
    certificationController: certs,
    awardController: awards,
    newsletterController: news,
    subscriberAdminController: subs,
    contactController: contact,
    videoController: video,
    videoAdminController: videoAdmin,
    articleController: articles,
    projectController: projects,
    skillController: skills,
    adminContentController: content,
    publicationController: publications,
    emailAdminController: emails,
    authService,
  } = container;
  const router = Router();
  const admin = [authMiddleware(authService), adminOnly(authService)];

  // --- Certifications ---
  router.get(
    '/certifications',
    validate({ query: certificationQuery }),
    h(certs, 'list')
  );
  router.post(
    '/certifications',
    ...admin,
    validate({ body: certificationCreate }),
    h(certs, 'create')
  );
  router.put(
    '/certifications/:id',
    ...admin,
    validate({ params: idParams, body: certificationUpdate }),
    h(certs, 'update')
  );
  router.delete(
    '/certifications/:id',
    ...admin,
    validate({ params: idParams }),
    h(certs, 'remove')
  );

  // --- Distinctions ---
  router.get('/awards', h(awards, 'list'));
  router.post('/awards', ...admin, validate({ body: awardCreate }), h(awards, 'create'));
  router.put(
    '/awards/:id',
    ...admin,
    validate({ params: idParams, body: awardUpdate }),
    h(awards, 'update')
  );
  router.delete(
    '/awards/:id',
    ...admin,
    validate({ params: idParams }),
    h(awards, 'remove')
  );

  // --- Newsletter (public, limitée) ---
  router.post(
    '/newsletter/subscribe',
    limiter(5),
    validate({ body: newsletterSubscribeBody }),
    h(news, 'subscribe')
  );
  router.get(
    '/newsletter/confirm',
    limiter(30),
    validate({ query: tokenQuery }),
    h(news, 'confirm')
  );
  router.get(
    '/newsletter/unsubscribe',
    limiter(30),
    validate({ query: tokenQuery }),
    h(news, 'unsubscribe')
  );
  router.post(
    '/newsletter/unsubscribe',
    limiter(30),
    validate({ query: tokenQuery }),
    h(news, 'unsubscribeOneClick')
  );

  // --- Contact (public, limité : 5 messages par heure et par adresse IP) ---
  router.post(
    '/contact',
    limiter(5),
    validate({ body: contactBody }),
    h(contact, 'send')
  );

  // --- Push (public, limité) ---
  router.post(
    '/push/subscribe',
    limiter(20),
    validate({ body: pushSubscribeBody }),
    h(news, 'pushSubscribe')
  );

  // --- Admin : abonnés ---
  router.get('/admin/subscribers', ...admin, h(subs, 'list'));
  router.delete(
    '/admin/subscribers/newsletter/:id',
    ...admin,
    validate({ params: idParams }),
    h(subs, 'removeNewsletter')
  );
  router.delete(
    '/admin/subscribers/push/:id',
    ...admin,
    validate({ params: idParams }),
    h(subs, 'removePush')
  );
  router.post(
    '/admin/newsletter/test-email',
    ...admin,
    limiter(10),
    validate({ body: testEmailBody }),
    h(subs, 'sendTestEmail')
  );

  // --- Formations vidéo : lecture publique (listes plus strictement limitées, 20 par page) ---
  router.get(
    '/video-series',
    limiter(60, 15 * 60 * 1000),
    validate({ query: seriesQuery }),
    h(video, 'listSeries')
  );
  router.get(
    '/video-series/:slug',
    validate({ params: slugParams }),
    h(video, 'getSeries')
  );
  router.get(
    '/video-series/:seriesSlug/videos/:videoSlug',
    validate({ params: slugsParams }),
    h(video, 'getVideo')
  );
  router.post(
    '/videos/:id/view',
    limiter(60),
    validate({ params: idParams }),
    h(video, 'view')
  );
  // Lecture : URL CloudFront signée (30 par heure et par IP)
  router.post(
    '/videos/:id/playback',
    limiter(30),
    validate({ params: idParams }),
    h(video, 'playback')
  );

  // --- Formations vidéo : administration ---
  router.get('/admin/video-series', ...admin, h(videoAdmin, 'listSeries'));
  router.get(
    '/admin/video-series/:id',
    ...admin,
    validate({ params: idParams }),
    h(videoAdmin, 'getSeries')
  );
  router.post(
    '/video-series',
    ...admin,
    validate({ body: seriesCreate }),
    h(videoAdmin, 'createSeries')
  );
  router.put(
    '/video-series/:id',
    ...admin,
    validate({ params: idParams, body: seriesUpdate }),
    h(videoAdmin, 'updateSeries')
  );
  router.delete(
    '/video-series/:id',
    ...admin,
    validate({ params: idParams }),
    h(videoAdmin, 'deleteSeries')
  );
  router.put(
    '/video-series/:id/order',
    ...admin,
    validate({ params: idParams, body: orderBody }),
    h(videoAdmin, 'order')
  );
  router.post(
    '/videos',
    ...admin,
    validate({ body: videoCreate }),
    h(videoAdmin, 'createVideo')
  );
  router.put(
    '/videos/:id',
    ...admin,
    validate({ params: idParams, body: videoUpdate }),
    h(videoAdmin, 'updateVideo')
  );
  router.delete(
    '/videos/:id',
    ...admin,
    validate({ params: idParams }),
    h(videoAdmin, 'deleteVideo')
  );
  router.post(
    '/admin/videos/upload-url',
    ...admin,
    limiter(60),
    validate({ body: uploadUrlBody }),
    h(videoAdmin, 'uploadUrl')
  );

  // Les routes suivantes ne sont montées que si la composition root fournit les contrôleurs
  if (articles) buildBlogRoutes(router, articles);
  if (projects && skills) buildPortfolioRoutes(router, admin, projects, skills);
  if (content) buildAdminContentRoutes(router, admin, content);
  if (publications)
    router.get('/publications', limiter(300, 15 * 60 * 1000), h(publications, 'list'));
  if (emails) buildEmailRoutes(router, admin, emails);

  return router;
}

// --- Administration : modèles de courriel, réponses et news ---
function buildEmailRoutes(router, admin, emails) {
  const template = { params: templateParams };
  router.get('/admin/email-templates', ...admin, h(emails, 'listTemplates'));
  router.put(
    '/admin/email-templates/:key',
    ...admin,
    validate({ ...template, body: templateBody }),
    h(emails, 'saveTemplate')
  );
  router.delete(
    '/admin/email-templates/:key',
    ...admin,
    validate(template),
    h(emails, 'resetTemplate')
  );
  router.post(
    '/admin/email-templates/:key/preview',
    ...admin,
    validate({ ...template, body: templateBody }),
    h(emails, 'preview')
  );
  router.post(
    '/admin/email-templates/:key/test',
    ...admin,
    limiter(10),
    validate({ ...template, body: templateTestBody }),
    h(emails, 'sendTest')
  );
  router.get(
    '/admin/messages/:id/reply',
    ...admin,
    validate({ params: idParams }),
    h(emails, 'replyDraft')
  );
  router.post(
    '/admin/messages/:id/reply',
    ...admin,
    limiter(60),
    validate({ params: idParams, body: replyBody }),
    h(emails, 'reply')
  );
  router.post(
    '/admin/newsletter/broadcast',
    ...admin,
    limiter(5),
    validate({ body: broadcastBody }),
    h(emails, 'broadcast')
  );
}

// --- Blog public : lecture limitée à 20 par page, écritures limitées en fréquence ---
function buildBlogRoutes(router, articles) {
  router.get(
    '/articles',
    limiter(120, 15 * 60 * 1000),
    validate({ query: articleQuery }),
    h(articles, 'list')
  );
  router.get('/articles/:slug', validate({ params: slugParams }), h(articles, 'get'));
  router.post(
    '/articles/:id/view',
    limiter(60),
    validate({ params: idParams }),
    h(articles, 'view')
  );
  router.post(
    '/articles/:id/like',
    limiter(30),
    validate({ params: idParams }),
    h(articles, 'like')
  );
  // Commentaires : 5 par heure et par IP, publiés après modération
  router.post(
    '/articles/:id/comments',
    limiter(5),
    validate({ params: idParams, body: commentBody }),
    h(articles, 'comment')
  );
}

// --- Projets et compétences : lecture publique, écriture admin ---
function buildPortfolioRoutes(router, admin, projects, skills) {
  for (const [path, ctrl, create, update] of [
    ['/projects', projects, projectCreate, projectUpdate],
    ['/skills', skills, skillCreate, skillUpdate],
  ]) {
    router.get(path, h(ctrl, 'list'));
    router.post(path, ...admin, validate({ body: create }), h(ctrl, 'create'));
    router.put(
      `${path}/:id`,
      ...admin,
      validate({ params: idParams, body: update }),
      h(ctrl, 'update')
    );
    router.delete(
      `${path}/:id`,
      ...admin,
      validate({ params: idParams }),
      h(ctrl, 'remove')
    );
  }
}

// --- Administration : tableau de bord, articles, commentaires, messages ---
function buildAdminContentRoutes(router, admin, content) {
  const byId = validate({ params: idParams });
  router.get('/admin/dashboard', ...admin, h(content, 'getDashboard'));

  router.get('/admin/articles', ...admin, h(content, 'listArticles'));
  router.get('/admin/articles/:id', ...admin, byId, h(content, 'getArticle'));
  router.post(
    '/admin/articles',
    ...admin,
    validate({ body: articleCreate }),
    h(content, 'createArticle')
  );
  router.put(
    '/admin/articles/:id',
    ...admin,
    validate({ params: idParams, body: articleUpdate }),
    h(content, 'updateArticle')
  );
  router.delete('/admin/articles/:id', ...admin, byId, h(content, 'deleteArticle'));
  router.post(
    '/admin/articles/:id/publish',
    ...admin,
    byId,
    h(content, 'publishArticle')
  );
  router.post(
    '/admin/articles/:id/unpublish',
    ...admin,
    byId,
    h(content, 'unpublishArticle')
  );

  router.get('/admin/comments', ...admin, h(content, 'listComments'));
  router.put(
    '/admin/comments/:id',
    ...admin,
    validate({ params: idParams, body: approveBody }),
    h(content, 'moderateComment')
  );
  router.delete('/admin/comments/:id', ...admin, byId, h(content, 'deleteComment'));

  router.get('/admin/messages', ...admin, h(content, 'listMessages'));
  router.put(
    '/admin/messages/:id',
    ...admin,
    validate({ params: idParams, body: readBody }),
    h(content, 'markMessage')
  );
  router.delete('/admin/messages/:id', ...admin, byId, h(content, 'deleteMessage'));
}
