import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import ApiClient from '../dal/clients/ApiClient.js';
import SupabaseAuthClient from '../dal/clients/SupabaseAuthClient.js';
import MessagingClient from '../dal/clients/MessagingClient.js';
import ArticleRepository from '../dal/repositories/ArticleRepository.js';
import CertificationRepository from '../dal/repositories/CertificationRepository.js';
import AwardRepository from '../dal/repositories/AwardRepository.js';
import NewsletterRepository from '../dal/repositories/NewsletterRepository.js';
import SubscriberAdminRepository from '../dal/repositories/SubscriberAdminRepository.js';
import ArticleService from '../bll/services/ArticleService.js';
import CertificationService from '../bll/services/CertificationService.js';
import AwardService from '../bll/services/AwardService.js';
import NewsletterService from '../bll/services/NewsletterService.js';
import PushService from '../bll/services/PushService.js';
import SubscriberAdminService from '../bll/services/SubscriberAdminService.js';
import UploadService from '../bll/services/UploadService.js';
import { createStore } from './store/store.js';

// Webpack remplace chaque `process.env.APP_...` par sa valeur (liste blanche dans webpack.config.js).
// Il faut donc écrire chaque variable en toutes lettres : pas de `const env = process.env`.
function readEnv() {
  return {
    apiUrl: process.env.APP_API_URL,
    supabaseUrl: process.env.APP_SUPABASE_URL,
    supabaseAnonKey: process.env.APP_SUPABASE_ANON_KEY,
    firebase: {
      apiKey: process.env.APP_FIREBASE_API_KEY,
      authDomain: process.env.APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.APP_FIREBASE_APP_ID,
    },
    vapidKey: process.env.APP_FIREBASE_VAPID_KEY,
  };
}

/** Seul endroit où l'on fait `new` sur les clients, repositories et services. */
export function createDependencies() {
  const env = readEnv();
  if (!env.apiUrl || !env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      'Variables manquantes : copiez client/.env.example vers client/.env et remplissez-le.'
    );
  }

  // DAL
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
  const authClient = new SupabaseAuthClient(supabase);
  const apiClient = new ApiClient(env.apiUrl, () => authClient.getAccessToken());
  const firebaseApp = env.firebase.apiKey ? initializeApp(env.firebase) : null;
  const messagingClient = new MessagingClient(firebaseApp, env.vapidKey);

  const articleRepository = new ArticleRepository(apiClient);
  const certificationRepository = new CertificationRepository(apiClient);
  const awardRepository = new AwardRepository(apiClient);
  const newsletterRepository = new NewsletterRepository(apiClient);
  const subscriberAdminRepository = new SubscriberAdminRepository(apiClient);

  // BLL
  const articleService = new ArticleService(articleRepository);
  const certificationService = new CertificationService(certificationRepository);
  const awardService = new AwardService(awardRepository);
  const newsletterService = new NewsletterService(newsletterRepository);
  const pushService = new PushService(messagingClient, newsletterRepository);
  const subscriberAdminService = new SubscriberAdminService(subscriberAdminRepository);
  const uploadService = new UploadService(authClient);
  const services = {
    articleService,
    certificationService,
    awardService,
    newsletterService,
    pushService,
    subscriberAdminService,
    uploadService,
    authClient,
    messagingClient,
  };

  // Web (store Redux : les thunks reçoivent `services` en 3e argument)
  const store = createStore(services);

  return { store, services };
}
