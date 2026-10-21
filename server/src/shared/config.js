import 'dotenv/config';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error('Variable manquante : ' + name);
  return value;
};

const env = process.env.NODE_ENV || 'development';
// En développement, les variables d'envoi de courriel sont facultatives
// (aucun courriel réel n'est envoyé). En production, elles sont obligatoires.
const emailVar = (name, fallback) =>
  env === 'production' ? required(name) : process.env[name] || fallback;

export const config = {
  port: Number(process.env.PORT) || 4000,
  env: process.env.NODE_ENV || 'development',
  clientOrigin: required('CLIENT_ORIGIN'),
  // Adresse publique du site (liens des notifications) : première origine de CLIENT_ORIGIN
  siteUrl: required('CLIENT_ORIGIN').split(',')[0].trim(),
  supabaseUrl: required('SUPABASE_URL'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  firebase: {
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  email: {
    apiKey: emailVar('EMAIL_API_KEY', ''),
    from: emailVar('EMAIL_FROM', 'Portfolio <no-reply@localhost>'),
    publicApiUrl: emailVar('PUBLIC_API_URL', 'http://localhost:4000'),
  },
};
