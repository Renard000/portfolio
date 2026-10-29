import { escapeHtml } from '../shared/html.js';

const wrap = (body, footer = '') =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.5">${body}${
    footer ? `<hr><p style="font-size:12px;color:#666">${footer}</p>` : ''
  }</div>`;

export function confirmationEmail({ confirmUrl }) {
  return {
    subject: 'Confirmez votre abonnement',
    html: wrap(
      `<h2>Confirmez votre abonnement</h2>
       <p>Vous (ou quelqu'un d'autre) avez demandé à recevoir un courriel à chaque nouvelle publication du portfolio.</p>
       <p><a href="${escapeHtml(confirmUrl)}">Confirmer mon abonnement</a></p>
       <p>Sans clic de votre part, vous ne recevrez rien.</p>`
    ),
  };
}

const KINDS = {
  article: { subject: 'Nouvel article', cta: "Lire l'article" },
  video: { subject: 'Nouvelle vidéo', cta: 'Regarder la vidéo' },
};

/** Courriel de publication (article ou vidéo) : tout le texte dynamique est échappé. */
export function contentEmail({ kind = 'article', title, excerpt, url, unsubscribeUrl }) {
  const k = KINDS[kind];
  return {
    subject: `${k.subject} : ${title}`,
    html: wrap(
      `<h2>${escapeHtml(title)}</h2>
       ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
       <p><a href="${escapeHtml(url)}">${k.cta}</a></p>`,
      `Vous recevez ce courriel car vous êtes abonné(e) à la newsletter. <a href="${escapeHtml(
        unsubscribeUrl
      )}">Me désabonner</a>`
    ),
  };
}

export function articleEmail({ article, articleUrl, unsubscribeUrl }) {
  return contentEmail({
    kind: 'article',
    title: article.title,
    excerpt: article.excerpt,
    url: articleUrl,
    unsubscribeUrl,
  });
}

export function testEmail() {
  return {
    subject: 'Courriel de test',
    html: wrap(
      '<p>Ceci est un courriel de test : la configuration d’envoi fonctionne.</p>'
    ),
  };
}

export function contactNotificationEmail({ nom, email, sujet, message }) {
  return {
    subject: `Nouveau message de ${nom}${sujet ? ` : ${sujet}` : ''}`.slice(0, 200),
    html: wrap(
      `<h2>Nouveau message du portfolio</h2>
       <p><strong>${escapeHtml(nom)}</strong> &lt;${escapeHtml(email)}&gt;</p>
       ${sujet ? `<p>Sujet : ${escapeHtml(sujet)}</p>` : ''}
       <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`
    ),
  };
}
