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
  testEmailBody,
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

  return router;
}
