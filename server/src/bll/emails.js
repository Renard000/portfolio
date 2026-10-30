import { escapeHtml } from '../shared/html.js';
import { PUBLICATION_LABELS } from '../domain/entities/Publication.js';

const wrap = (body, footer = '') =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.5">${body}${
    footer ? `<hr><p style="font-size:12px;color:#666">${footer}</p>` : ''
  }</div>`;

/** Bas de courriel : qui écrit et comment le joindre. */
const senderLine = ({ name, address, site } = {}) => {
  const parts = [name, address, site].filter(Boolean).map(escapeHtml);
  return parts.length ? `Expéditeur : ${parts.join(' · ')}.` : '';
};

export function confirmationEmail({ confirmUrl, sender }) {
  return {
    subject: 'Confirmez votre abonnement',
    html: wrap(
      `<h2>Confirmez votre abonnement</h2>
       <p>Vous (ou quelqu'un d'autre) avez demandé à recevoir un courriel à chaque nouvelle publication du portfolio.</p>
       <p><a href="${escapeHtml(confirmUrl)}">Confirmer mon abonnement</a></p>
       <p>Sans clic de votre part, vous ne recevrez rien.</p>`,
      senderLine(sender)
    ),
  };
}

const CALLS_TO_ACTION = {
  article: "Lire l'article",
  video: 'Regarder la vidéo',
  series: 'Découvrir la formation',
  certification: 'Voir les certifications',
  award: 'Voir les distinctions',
  project: 'Découvrir le projet',
};

/** Courriel de publication, quel qu'en soit le type : tout le texte dynamique est échappé. */
export function contentEmail({
  kind = 'article',
  title,
  excerpt,
  url,
  unsubscribeUrl,
  sender,
}) {
  return {
    subject: `${PUBLICATION_LABELS[kind]} : ${title}`,
    html: wrap(
      `<h2>${escapeHtml(title)}</h2>
       ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
       <p><a href="${escapeHtml(url)}">${CALLS_TO_ACTION[kind]}</a></p>`,
      `${senderLine(sender)} Vous recevez ce courriel car vous êtes abonné(e) à la newsletter. <a href="${escapeHtml(
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
