/** Les clés d'API Brevo commencent toutes par ce préfixe ; les autres sont des clés Resend. */
const BREVO_KEY_PREFIX = 'xkeysib-';

/** « Portfolio <moi@exemple.com> » → { name: 'Portfolio', email: 'moi@exemple.com' } */
export function parseAddress(from) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  if (!match) return { email: from.trim() };
  return match[1]
    ? { name: match[1], email: match[2].trim() }
    : { email: match[2].trim() };
}

/**
 * Envoi de courriels transactionnels par l'API HTTP de Brevo ou de Resend,
 * choisie d'après la clé. La BLL ne connaît que send({ to, subject, html }) :
 * changer de fournisseur ne touche que ce fichier.
 */
export default class EmailClient {
  constructor(apiKey, from, fetchImpl = (...args) => fetch(...args)) {
    this.apiKey = apiKey;
    this.from = from;
    this.fetchImpl = fetchImpl;
    this.provider = apiKey.startsWith(BREVO_KEY_PREFIX) ? 'brevo' : 'resend';
  }

  #request({ to, subject, html, text, headers, replyTo }) {
    if (this.provider === 'brevo')
      return [
        'https://api.brevo.com/v3/smtp/email',
        {
          headers: { 'api-key': this.apiKey },
          body: {
            sender: parseAddress(this.from),
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text,
            headers,
            replyTo: replyTo ? { email: replyTo } : undefined,
          },
        },
      ];
    return [
      'https://api.resend.com/emails',
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: {
          from: this.from,
          to: [to],
          subject,
          html,
          text,
          headers,
          reply_to: replyTo,
        },
      },
    ];
  }

  async send(message) {
    const [url, { headers, body }] = this.#request(message);
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      // Ni le corps du courriel ni la clé ne sont journalisés.
      throw new Error(
        `Envoi de courriel refusé par ${this.provider} (HTTP ${response.status})`
      );
    }
  }
}

/** Remplaçant de développement : n'envoie rien, journalise seulement le sujet. */
export class ConsoleEmailClient {
  constructor(logger = console) {
    this.logger = logger;
  }

  async send({ to, subject }) {
    this.logger.log(`[email simulé] à ${to} : ${subject}`);
  }
}
