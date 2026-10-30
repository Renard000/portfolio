import { z } from 'zod';

const isRealDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const day = z.string().refine(isRealDate, 'Date invalide (AAAA-MM-JJ)');

/** URL http(s) uniquement : refuse javascript:, data:, etc. (liens rendus dans <a>). */
const httpUrl = z
  .string()
  .max(2000)
  .refine((v) => {
    try {
      return ['http:', 'https:'].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'URL http(s) invalide');

const optText = (max) => z.string().trim().max(max).nullable().optional();
const optUrl = httpUrl.nullable().optional();

export const idParams = z.object({ id: z.uuid() });
export const tokenQuery = z.object({ token: z.uuid() });

const certificationShape = z.object({
  title: z.string().trim().min(1).max(200),
  issuer: z.string().trim().min(1).max(200),
  category: optText(100),
  description: optText(5000),
  issueDate: day,
  expiryDate: day.nullable().optional(),
  credentialId: optText(200),
  credentialUrl: optUrl,
  imageUrl: optUrl,
  documentUrl: optUrl,
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
});
const expiryAfterIssue = (v) =>
  !v.expiryDate || !v.issueDate || v.expiryDate >= v.issueDate;
const expiryMessage = {
  message: "La date d'expiration doit suivre la date d'obtention",
  path: ['expiryDate'],
};

// Création seulement : false pour ajouter un ancien contenu sans écrire aux abonnés
const notifyOption = { notify: z.boolean().optional() };

export const certificationCreate = certificationShape
  .extend(notifyOption)
  .refine(expiryAfterIssue, expiryMessage);
export const certificationUpdate = certificationShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier')
  .refine(expiryAfterIssue, expiryMessage);

export const certificationQuery = z.object({
  issuer: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  q: z.string().trim().max(100).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['date_desc', 'date_asc']).optional(),
});

const awardShape = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(['scholarship', 'merit', 'award', 'honor']).optional(),
  organization: z.string().trim().min(1).max(200),
  description: optText(5000),
  amount: z.number().min(0).max(1e9).nullable().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  awardedAt: day,
  imageUrl: optUrl,
  documentUrl: optUrl,
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
});
export const awardCreate = awardShape.extend(notifyOption);
export const awardUpdate = awardShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');

export const newsletterSubscribeBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  // Le consentement explicite est obligatoire (LCAP / Loi 25).
  consent: z.literal(true, { error: 'Le consentement est obligatoire' }),
  // Honeypot : champ invisible que seuls les robots remplissent.
  website: z.string().max(500).optional(),
});

export const pushSubscribeBody = z.object({
  token: z.string().trim().min(20).max(4096),
});

export const testEmailBody = z.object({
  to: z.string().trim().toLowerCase().pipe(z.email().max(254)),
});

export const contactBody = z.object({
  nom: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  sujet: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(5000),
  // Honeypot : champ invisible que seuls les robots remplissent.
  website: z.string().max(500).optional(),
});

// ---------- Vidéos (addendum C) ----------
const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug invalide (minuscules, chiffres, tirets)');
// Clés S3 : même règle que la base, sans « .. » ni « // »
const noTraversal = (v) => !/\.\.|\/\//.test(v);
const videoKey = z
  .string()
  .regex(/^videos\/[a-z0-9/_.-]+\.mp4$/)
  .refine(noTraversal, 'Clé invalide');
const posterKey = z
  .string()
  .regex(/^posters\/[a-z0-9/_.-]+\.(jpg|png|webp)$/)
  .refine(noTraversal, 'Clé invalide');
const chapter = z.object({
  t: z.number().int().min(0),
  label: z.string().trim().min(1).max(120),
});
const resource = z.object({ label: z.string().trim().min(1).max(120), url: httpUrl });

export const seriesQuery = z.object({
  category: z.string().trim().max(100).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tag: z.string().trim().max(60).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['recent']).optional(),
  // E.7 : pages de taille limitée (20 maximum)
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
export const slugsParams = z.object({ seriesSlug: slug, videoSlug: slug });
export const slugParams = z.object({ slug });

const seriesShape = z.object({
  title: z.string().trim().min(1).max(200),
  slug,
  description: optText(5000),
  coverUrl: optUrl,
  category: optText(100),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/)
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
});
export const seriesCreate = seriesShape;
export const seriesUpdate = seriesShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');

const videoShape = z.object({
  seriesId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  slug,
  description: optText(10000),
  videoKey,
  posterKey: posterKey.nullable().optional(),
  durationSeconds: z.number().int().min(1).max(86400),
  chapters: z.array(chapter).max(60).optional(),
  resources: z.array(resource).max(20).optional(),
  status: z.enum(['draft', 'published']).optional(),
});
export const videoCreate = videoShape;
export const videoUpdate = videoShape
  .omit({ seriesId: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');

export const orderBody = z.object({ videoIds: z.array(z.uuid()).min(1).max(200) });

// Le client n'envoie JAMAIS de chemin : seulement série, slug, type et taille.
export const uploadUrlBody = z.object({
  seriesId: z.uuid(),
  videoSlug: slug,
  kind: z.enum(['video', 'poster']).default('video'),
  contentType: z.string().max(100),
  size: z.number().int().min(1),
  position: z.number().int().min(1).max(999).optional(),
});

// ---------- Blog (articles, commentaires) ----------
const tagList = z.array(z.string().trim().min(1).max(40)).max(20).optional();

export const articleQuery = z.object({
  category: z.string().trim().max(100).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  // E.7 : pages de taille limitée (20 maximum)
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const articleShape = z.object({
  title: z.string().trim().min(1).max(200),
  slug,
  excerpt: optText(500),
  content: z.string().max(200000),
  coverUrl: optUrl,
  category: optText(100),
  tags: tagList,
});
export const articleCreate = articleShape;
export const articleUpdate = articleShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');

export const commentBody = z.object({
  author: z.string().trim().min(1).max(80),
  content: z.string().trim().min(2).max(2000),
  // Honeypot : champ invisible que seuls les robots remplissent.
  website: z.string().max(500).optional(),
});
export const approveBody = z.object({ approved: z.boolean() });

// ---------- Courriels ----------
export const templateParams = z.object({
  key: z.enum([
    'confirmation',
    'reply',
    'news',
    'article',
    'video',
    'series',
    'certification',
    'award',
    'project',
  ]),
});
const templateShape = z.object({
  subject: z.string().trim().min(1).max(200),
  heading: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  ctaLabel: optText(60),
});
export const templateBody = templateShape;
export const templateTestBody = templateShape.extend({
  to: z.string().trim().toLowerCase().pipe(z.email().max(254)),
});
export const replyBody = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
});
export const broadcastBody = templateShape.extend({ ctaUrl: optUrl });
export const readBody = z.object({ lu: z.boolean() });

// ---------- Projets et compétences ----------
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale attendue (#RRGGBB)')
  .nullable()
  .optional();

const projectShape = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  category: optText(100),
  summary: optText(500),
  description: optText(5000),
  challenge: optText(5000),
  solution: optText(5000),
  role: optText(120),
  duration: optText(60),
  year: optText(20),
  tech: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  results: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  githubUrl: optUrl,
  liveUrl: optUrl,
  imageUrl: optUrl,
  color: hexColor,
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
});
export const projectCreate = projectShape.extend(notifyOption);
export const projectUpdate = projectShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');

const skillShape = z.object({
  name: z.string().trim().min(1).max(100),
  level: z.number().int().min(0).max(100),
  icon: optText(60),
  sortOrder: z.number().int().min(-100000).max(100000).optional(),
});
export const skillCreate = skillShape;
export const skillUpdate = skillShape
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à modifier');
