import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import ApiClient from '../dal/clients/ApiClient.js';
import SupabaseAuthClient from '../dal/clients/SupabaseAuthClient.js';
import MessagingClient from '../dal/clients/MessagingClient.js';
import ArticleRepository from '../dal/repositories/ArticleRepository.js';
import ArticleService from '../bll/services/ArticleService.js';
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

  // BLL
  const articleService = new ArticleService(articleRepository);
  const services = { articleService, authClient, messagingClient };

  // Web (store Redux : les thunks reçoivent `services` en 3e argument)
  const store = createStore(services);

  return { store, services };
}
