import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import WebSocket from 'ws'; // Import explicite pour Node < 22

import EmailClient, { ConsoleEmailClient } from '../dal/clients/EmailClient.js';
import FirebaseAdmin from '../dal/clients/FirebaseAdmin.js';
import CertificationRepository from '../dal/repositories/CertificationRepository.js';
import AwardRepository from '../dal/repositories/AwardRepository.js';
import NewsletterRepository from '../dal/repositories/NewsletterRepository.js';
import PushSubscriptionRepository from '../dal/repositories/PushSubscriptionRepository.js';
import ArticleRepository from '../dal/repositories/ArticleRepository.js';
import AuthRepository from '../dal/repositories/AuthRepository.js';

import CertificationService from '../bll/services/CertificationService.js';
import AwardService from '../bll/services/AwardService.js';
import NewsletterService from '../bll/services/NewsletterService.js';
import PushSubscriptionService from '../bll/services/PushSubscriptionService.js';
import SubscriberAdminService from '../bll/services/SubscriberAdminService.js';
import NotificationService from '../bll/services/NotificationService.js';
import ArticleService from '../bll/services/ArticleService.js';
import AuthService from '../bll/services/AuthService.js';

import CertificationController from './controllers/CertificationController.js';
import AwardController from './controllers/AwardController.js';
import NewsletterController from './controllers/NewsletterController.js';
import SubscriberAdminController from './controllers/SubscriberAdminController.js';

/** Seul fichier qui fait des `new` sur clients, repositories, services et contrôleurs. */
export function buildContainer(config) {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false },
    realtime: {
      transport: WebSocket, // Fournit le WebSocket pour les environnements Node plus anciens
    },
  });

  // DAL — Firebase Admin est initialisé à la première notification seulement
  const firebaseAdmin = new FirebaseAdmin(() => {
    const app = getApps()[0] || initializeApp({ credential: cert(config.firebase) });
    return getMessaging(app);
  });
  const emailClient = config.email.apiKey
    ? new EmailClient(config.email.apiKey, config.email.from)
    : new ConsoleEmailClient();

  const certificationRepository = new CertificationRepository(supabase);
  const awardRepository = new AwardRepository(supabase);
  const newsletterRepository = new NewsletterRepository(supabase);
  const pushSubscriptionRepository = new PushSubscriptionRepository(supabase);
  const articleRepository = new ArticleRepository(supabase);
  const authRepository = new AuthRepository(supabase);

  // BLL
  const certificationService = new CertificationService(certificationRepository);
  const awardService = new AwardService(awardRepository);
  const newsletterService = new NewsletterService(newsletterRepository, emailClient, {
    publicApiUrl: config.email.publicApiUrl,
  });
  const pushSubscriptionService = new PushSubscriptionService(pushSubscriptionRepository);
  const subscriberAdminService = new SubscriberAdminService(
    newsletterRepository,
    pushSubscriptionRepository
  );
  const notificationService = new NotificationService(
    newsletterRepository,
    pushSubscriptionRepository,
    emailClient,
    firebaseAdmin,
    { siteUrl: config.siteUrl, publicApiUrl: config.email.publicApiUrl }
  );
  const articleService = new ArticleService(articleRepository, notificationService);
  const authService = new AuthService(authRepository);

  // Web
  return {
    supabase,
    authService,
    articleService,
    certificationController: new CertificationController(certificationService),
    awardController: new AwardController(awardService),
    newsletterController: new NewsletterController(
      newsletterService,
      pushSubscriptionService
    ),
    subscriberAdminController: new SubscriberAdminController(
      subscriberAdminService,
      newsletterService
    ),
  };
}
