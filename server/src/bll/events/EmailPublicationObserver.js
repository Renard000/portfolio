import { chunk } from '../../shared/html.js';
import { contentEmail } from '../emails.js';

/** Observateur : courriel aux abonnés confirmés de la newsletter, par lots. */
export default class EmailPublicationObserver {
  channel = 'email';

  constructor(
    newsletterRepository,
    emailClient,
    { siteUrl, publicApiUrl, batchSize = 50 }
  ) {
    this.newsletterRepository = newsletterRepository;
    this.emailClient = emailClient;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
    this.publicApiUrl = publicApiUrl.replace(/\/+$/, '');
    this.batchSize = batchSize;
  }

  async onPublication(publication) {
    // Règle d'envoi, revérifiée ici même si le repository filtre déjà.
    const receivers = (await this.newsletterRepository.listReceivers()).filter((s) =>
      s.canReceive()
    );
    let sent = 0;
    let failed = 0;
    for (const batch of chunk(receivers, this.batchSize)) {
      const results = await Promise.allSettled(
        batch.map((s) =>
          this.emailClient.send({
            to: s.email,
            ...contentEmail({
              kind: publication.kind,
              title: publication.title,
              excerpt: publication.excerpt,
              url: publication.url(this.siteUrl),
              unsubscribeUrl: `${this.publicApiUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(
                s.unsubscribeToken
              )}`,
            }),
          })
        )
      );
      sent += results.filter((r) => r.status === 'fulfilled').length;
      failed += results.filter((r) => r.status === 'rejected').length;
    }
    return { sent, failed, deactivated: 0 };
  }
}
