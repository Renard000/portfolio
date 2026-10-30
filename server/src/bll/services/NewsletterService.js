import { NotFoundError } from '../../domain/errors/index.js';
import { confirmationEmail, newsEmail, testEmail } from '../emails.js';
import { sendInBatches } from '../sendInBatches.js';

export default class NewsletterService {
  /**
   * @param {object} deps newsletterRepository, emailClient
   * @param {object} options publicApiUrl : base des liens des courriels
   */
  constructor(
    newsletterRepository,
    emailClient,
    { publicApiUrl, sender, templates = null, batchSize = 50, clock = () => new Date() }
  ) {
    this.repo = newsletterRepository;
    this.emailClient = emailClient;
    this.publicApiUrl = publicApiUrl.replace(/\/+$/, '');
    this.sender = sender;
    this.templates = templates;
    this.batchSize = batchSize;
    this.clock = clock;
  }

  link(action, token) {
    return `${this.publicApiUrl}/api/newsletter/${action}?token=${encodeURIComponent(token)}`;
  }

  /**
   * Double opt-in : crée une ligne NON confirmée et envoie le courriel de confirmation.
   * La réponse est toujours identique (pas de fuite sur les adresses déjà inscrites).
   */
  async subscribe({ email, website }) {
    // Honeypot rempli : on fait semblant que tout va bien, sans rien écrire ni envoyer.
    if (website) return { status: 'pending' };

    const normalized = String(email).trim().toLowerCase();
    let subscriber = await this.repo.findByEmail(normalized);

    if (subscriber && subscriber.canReceive()) return { status: 'pending' };

    if (!subscriber) {
      subscriber = await this.repo.create(normalized);
    } else if (subscriber.unsubscribedAt || !subscriber.active) {
      // Ré-inscription après désinscription : nouvelle confirmation obligatoire.
      subscriber = await this.repo.update(subscriber.id, {
        active: true,
        confirmedAt: null,
        unsubscribedAt: null,
        regenerateConfirmToken: true,
      });
    }

    const mail = confirmationEmail({
      confirmUrl: this.link('confirm', subscriber.confirmToken),
      sender: this.sender,
      template: this.templates ? await this.templates.get('confirmation') : undefined,
    });
    await this.emailClient.send({ to: subscriber.email, ...mail });
    return { status: 'pending' };
  }

  /** Idempotent : confirmer deux fois ne change rien. */
  async confirm(token) {
    const subscriber = await this.repo.findByConfirmToken(token);
    if (!subscriber) throw new NotFoundError('Lien de confirmation invalide');
    if (!subscriber.isConfirmed() || !subscriber.active) {
      await this.repo.update(subscriber.id, {
        active: true,
        confirmedAt: this.clock().toISOString(),
        unsubscribedAt: null,
      });
    }
  }

  /** Aucune connexion requise : le jeton aléatoire fait foi. Idempotent. */
  async unsubscribe(token) {
    const subscriber = await this.repo.findByUnsubscribeToken(token);
    if (!subscriber) throw new NotFoundError('Lien de désinscription invalide');
    if (subscriber.active || !subscriber.unsubscribedAt) {
      await this.repo.update(subscriber.id, {
        active: false,
        unsubscribedAt: this.clock().toISOString(),
      });
    }
  }

  /** Bouton admin « Envoyer un courriel de test » avant la première vraie diffusion. */
  async sendTest(to) {
    await this.emailClient.send({ to, ...testEmail(this.sender) });
  }

  /** News rédigée dans l'admin : aux abonnés confirmés et actifs seulement. */
  async broadcast({ ctaUrl, ...template }) {
    const receivers = (await this.repo.listReceivers()).filter((s) => s.canReceive());
    return sendInBatches(this.emailClient, receivers, this.batchSize, (s) =>
      newsEmail({
        template,
        url: ctaUrl,
        unsubscribeUrl: this.link('unsubscribe', s.unsubscribeToken),
        sender: this.sender,
      })
    );
  }
}
