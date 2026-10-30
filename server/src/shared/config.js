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
  // Adresse qui reçoit une copie des messages du formulaire de contact (facultatif)
  contact: { notifyTo: process.env.CONTACT_TO_EMAIL || '' },
  // Vidéos (addendum C/E) : facultatif. Sans ces variables, les routes vidéo qui touchent
  // S3 / CloudFront répondent 503 ; la lecture des listes (base de données) reste possible.
  aws: {
    region: process.env.AWS_REGION || 'ca-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucket: process.env.S3_BUCKET || '',
  },
  cloudfront: {
    url: process.env.CLOUDFRONT_URL || '',
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || '',
    // Contenu PEM, \n littéraux comme pour la clé Firebase
    privateKey: (process.env.CLOUDFRONT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  maxVideoBytes: Number(process.env.MAX_VIDEO_BYTES) || 3 * 1024 * 1024 * 1024,
  email: {
    apiKey: emailVar('EMAIL_API_KEY', ''),
    from: emailVar('EMAIL_FROM', 'Portfolio <no-reply@localhost>'),
    publicApiUrl: emailVar('PUBLIC_API_URL', 'http://localhost:4000'),
    // Adresse qui reçoit les réponses aux courriels envoyés depuis l'admin (facultatif)
    replyTo: process.env.EMAIL_REPLY_TO || '',
    // Identification de l'expéditeur dans le bas de chaque courriel (LCAP / CASL)
    sender: {
      name: process.env.EMAIL_SENDER_NAME || '',
      address: process.env.EMAIL_POSTAL_ADDRESS || '',
    },
  },
};
