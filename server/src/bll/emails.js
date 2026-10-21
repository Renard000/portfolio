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

export function articleEmail({ article, articleUrl, unsubscribeUrl }) {
  return {
    subject: `Nouvel article : ${article.title}`,
    html: wrap(
      `<h2>${escapeHtml(article.title)}</h2>
       ${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ''}
       <p><a href="${escapeHtml(articleUrl)}">Lire l'article</a></p>`,
      `Vous recevez ce courriel car vous êtes abonné(e) à la newsletter. <a href="${escapeHtml(
        unsubscribeUrl
      )}">Me désabonner</a>`
    ),
  };
}

export function testEmail() {
  return {
    subject: 'Courriel de test',
    html: wrap(
      '<p>Ceci est un courriel de test : la configuration d’envoi fonctionne.</p>'
    ),
  };
}
