import { escapeHtml } from '../shared/html.js';
import { DEFAULT_TEMPLATES } from './emailTemplates.js';

const COLORS = {
  page: '#f3f4f6',
  card: '#ffffff',
  ink: '#0a0b10',
  text: '#374151',
  muted: '#6b7280',
  line: '#e5e7eb',
  accent: '#c8f560',
};
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Remplace {{variable}} ; une variable inconnue ou vide disparaît. */
export function fill(text, variables) {
  return String(text ?? '').replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, name) => variables[name] ?? ''
  );
}

/** Une ligne vide sépare deux paragraphes ; les paragraphes vides sont retirés. */
const toParagraphs = (text) =>
  String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const paragraphHtml = (p) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${COLORS.text}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`;

const buttonHtml = ({ label, url }) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr>` +
  `<td style="border-radius:8px;background:${COLORS.ink}">` +
  `<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>` +
  `</td></tr></table>`;

const quoteHtml = (quote) =>
  `<div style="margin-top:24px;padding:12px 16px;border-left:3px solid ${COLORS.line};font-size:14px;line-height:1.6;color:${COLORS.muted}">${escapeHtml(quote).replace(/\n/g, '<br>')}</div>`;

/** Gabarit commun : tableaux et styles en ligne, seuls compris par tous les logiciels de courriel. */
export function layout({ brand, preheader, heading, paragraphs, cta, quote, footer }) {
  return (
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${escapeHtml(heading)}</title></head>` +
    `<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT}">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page}"><tr><td align="center" style="padding:32px 16px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">` +
    `<tr><td style="background:${COLORS.ink};padding:20px 32px;border-radius:12px 12px 0 0;font-size:18px;font-weight:700;color:#ffffff">` +
    `${escapeHtml(brand)}<span style="color:${COLORS.accent}">.</span></td></tr>` +
    `<tr><td style="background:${COLORS.card};padding:32px">` +
    `<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:700;color:${COLORS.ink}">${escapeHtml(heading)}</h1>` +
    paragraphs.map(paragraphHtml).join('') +
    (cta ? buttonHtml(cta) : '') +
    (quote ? quoteHtml(quote) : '') +
    `</td></tr>` +
    `<tr><td style="background:${COLORS.card};padding:0 32px 24px;border-radius:0 0 12px 12px">` +
    `<div style="border-top:1px solid ${COLORS.line};padding-top:16px;font-size:12px;line-height:1.6;color:${COLORS.muted}">${footer}</div>` +
    `</td></tr></table></td></tr></table></body></html>`
  );
}

const senderLine = ({ name, address, site } = {}) => {
  const parts = [name, address, site].filter(Boolean).map(escapeHtml);
  return parts.length ? `${parts.join(' · ')}` : '';
};

const textVersion = ({ heading, paragraphs, cta, quote, footerText }) =>
  [
    heading,
    ...paragraphs,
    cta ? `${cta.label} : ${cta.url}` : '',
    quote ? `---\n${quote}` : '',
    footerText ? `--\n${footerText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

/**
 * Transforme un modèle en courriel complet : version HTML ET version texte (son absence
 * pénalise la délivrabilité). Le texte du modèle et les variables sont échappés au rendu.
 */
export function renderEmail(
  template,
  variables,
  { sender, url, unsubscribeUrl, quote, notice } = {}
) {
  const vars = { site: sender?.site || '', ...variables };
  const heading = fill(template.heading, vars);
  const paragraphs = toParagraphs(fill(template.body, vars));
  const cta = url && template.ctaLabel ? { label: template.ctaLabel, url } : null;
  const identity = senderLine(sender);
  const footer = [
    identity,
    notice ? escapeHtml(notice) : '',
    unsubscribeUrl
      ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLORS.muted}">Me désabonner</a>`
      : '',
  ]
    .filter(Boolean)
    .join('<br>');
  const footerText = [
    [sender?.name, sender?.address, sender?.site].filter(Boolean).join(' · '),
    notice,
    unsubscribeUrl ? `Me désabonner : ${unsubscribeUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    subject: fill(template.subject, vars).trim().slice(0, 200),
    html: layout({
      brand: sender?.name || 'Portfolio',
      preheader: paragraphs[0] || heading,
      heading,
      paragraphs,
      cta,
      quote,
      footer,
    }),
    text: textVersion({ heading, paragraphs, cta, quote, footerText }),
    ...(unsubscribeUrl
      ? {
          // Désinscription en un clic (RFC 8058), exigée par Gmail pour les envois en nombre
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
      : {}),
  };
}

const SUBSCRIBED_NOTICE =
  'Vous recevez ce courriel car vous êtes abonné(e) à mes publications.';

export function confirmationEmail({
  confirmUrl,
  sender,
  template = DEFAULT_TEMPLATES.confirmation,
}) {
  return renderEmail(template, {}, { sender, url: confirmUrl });
}

/** Courriel de publication, quel qu'en soit le type. */
export function contentEmail({
  kind = 'article',
  title,
  excerpt,
  url,
  unsubscribeUrl,
  sender,
  template = DEFAULT_TEMPLATES[kind],
}) {
  return renderEmail(
    template,
    { titre: title, extrait: excerpt || '' },
    { sender, url, unsubscribeUrl, notice: SUBSCRIBED_NOTICE }
  );
}

/** News rédigée dans l'admin et envoyée à tous les abonnés. */
export function newsEmail({ template, url, unsubscribeUrl, sender }) {
  return renderEmail(
    template,
    {},
    { sender, url, unsubscribeUrl, notice: SUBSCRIBED_NOTICE }
  );
}

/** Réponse de l'admin à un message du formulaire de contact. */
export function replyEmail({ template, message, sender }) {
  return renderEmail(
    template,
    { nom: message.nom, sujet: message.sujet || 'votre message' },
    { sender, quote: `${message.nom} a écrit :\n${message.message}` }
  );
}

export function testEmail(sender) {
  return renderEmail(
    {
      subject: 'Courriel de test',
      heading: 'Courriel de test',
      body: 'Ceci est un courriel de test : la configuration d’envoi fonctionne.',
    },
    {},
    { sender }
  );
}

export function contactNotificationEmail({ nom, email, sujet, message }) {
  return renderEmail(
    {
      subject: `Nouveau message de ${nom}${sujet ? ` : ${sujet}` : ''}`,
      heading: 'Nouveau message du portfolio',
      body: `${nom} <${email}>${sujet ? `\n\nSujet : ${sujet}` : ''}\n\n${message}`,
    },
    {}
  );
}
