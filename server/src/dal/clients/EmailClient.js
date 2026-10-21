/**
 * Envoi de courriels transactionnels via l'API HTTP de Resend.
 * La BLL ne connaît que send({ to, subject, html }) : changer de fournisseur
 * (Brevo...) ne touche que ce fichier.
 */
export default class EmailClient {
  constructor(apiKey, from, fetchImpl = (...args) => fetch(...args)) {
    this.apiKey = apiKey;
    this.from = from;
    this.fetchImpl = fetchImpl;
  }

  async send({ to, subject, html }) {
    const response = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to: [to], subject, html }),
    });
    if (!response.ok) {
      // Ni le corps du courriel ni la clé ne sont journalisés.
      throw new Error(`Envoi de courriel refusé (HTTP ${response.status})`);
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
