import { chunk } from '../../shared/html.js';
import { articleEmail } from '../emails.js';

const FCM_BATCH = 500;

export default class NotificationService {
  constructor(
    newsletterRepository,
    pushSubscriptionRepository,
    emailClient,
    firebaseAdmin,
    { siteUrl, publicApiUrl, batchSize = 50, logger = console }
  ) {
    this.newsletterRepository = newsletterRepository;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
    this.emailClient = emailClient;
    this.firebaseAdmin = firebaseAdmin;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
    this.publicApiUrl = publicApiUrl.replace(/\/+$/, '');
    this.batchSize = batchSize;
    this.logger = logger;
  }

  articleUrl(article) {
    return `${this.siteUrl}/blog/${encodeURIComponent(article.slug)}`;
  }

  /** Une panne d'un canal n'empêche jamais l'autre, ni la publication. */
  async notifyPublished(article) {
    const [email, push] = await Promise.all([
      this.#sendEmails(article).catch((err) => this.#fail('courriel', err)),
      this.#sendPush(article).catch((err) => this.#fail('push', err)),
    ]);
    this.logger.log(
      `[notifications] article ${article.id} — courriels : ${email.sent} ok / ${email.failed} échecs ; ` +
        `push : ${push.sent} ok / ${push.failed} échecs / ${push.deactivated} jetons désactivés`
    );
    return { email, push };
  }

  #fail(channel, err) {
    this.logger.error(`[notifications] canal ${channel} en erreur : ${err.message}`);
    return { sent: 0, failed: 0, deactivated: 0, error: true };
  }

  async #sendEmails(article) {
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
            ...articleEmail({
              article,
              articleUrl: this.articleUrl(article),
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

  async #sendPush(article) {
    const tokens = (await this.pushSubscriptionRepository.listActive()).map(
      (p) => p.fcmToken
    );
    let sent = 0;
    let failed = 0;
    const invalid = [];
    for (const batch of chunk(tokens, FCM_BATCH)) {
      const r = await this.firebaseAdmin.sendToTokens(batch, {
        title: 'Nouvel article',
        body: article.title,
        url: this.articleUrl(article),
      });
      sent += r.successCount;
      failed += r.failureCount;
      invalid.push(...r.invalidTokens);
    }
    // Les jetons expirent régulièrement : on les désactive.
    if (invalid.length) await this.pushSubscriptionRepository.deactivate(invalid);
    return { sent, failed, deactivated: invalid.length };
  }
}
