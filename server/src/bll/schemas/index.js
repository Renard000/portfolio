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

export const certificationCreate = certificationShape.refine(
  expiryAfterIssue,
  expiryMessage
);
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
export const awardCreate = awardShape;
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
