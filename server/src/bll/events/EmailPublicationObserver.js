import { contentEmail } from '../emails.js';
import { sendInBatches } from '../sendInBatches.js';

export const unsubscribeLink = (publicApiUrl, subscriber) =>
  `${publicApiUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;

/** Observateur : courriel aux abonnés confirmés de la newsletter, par lots. */
export default class EmailPublicationObserver {
  channel = 'email';

  constructor(
    newsletterRepository,
    emailClient,
    { siteUrl, publicApiUrl, batchSize = 50, sender, templates = null }
  ) {
    this.newsletterRepository = newsletterRepository;
    this.emailClient = emailClient;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
    this.publicApiUrl = publicApiUrl.replace(/\/+$/, '');
    this.batchSize = batchSize;
    this.sender = sender;
    this.templates = templates;
  }

  async onPublication(publication) {
    // Règle d'envoi, revérifiée ici même si le repository filtre déjà.
    const receivers = (await this.newsletterRepository.listReceivers()).filter((s) =>
      s.canReceive()
    );
    const template = this.templates
      ? await this.templates.get(publication.kind)
      : undefined;
    const { sent, failed } = await sendInBatches(
      this.emailClient,
      receivers,
      this.batchSize,
      (s) =>
        contentEmail({
          kind: publication.kind,
          title: publication.title,
          excerpt: publication.excerpt,
          url: publication.url(this.siteUrl),
          sender: this.sender,
          template,
          unsubscribeUrl: unsubscribeLink(this.publicApiUrl, s),
        })
    );
    return { sent, failed, deactivated: 0 };
  }
}
