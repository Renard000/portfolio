import { chunk } from '../../shared/html.js';

const FCM_BATCH = 500;

/** Observateur : notification push FCM aux appareils actifs. */
export default class PushPublicationObserver {
  channel = 'push';

  constructor(pushSubscriptionRepository, firebaseAdmin, { siteUrl }) {
    this.pushSubscriptionRepository = pushSubscriptionRepository;
    this.firebaseAdmin = firebaseAdmin;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
  }

  async onPublication(publication) {
    const tokens = (await this.pushSubscriptionRepository.listActive()).map(
      (p) => p.fcmToken
    );
    let sent = 0;
    let failed = 0;
    const invalid = [];
    for (const batch of chunk(tokens, FCM_BATCH)) {
      const r = await this.firebaseAdmin.sendToTokens(batch, {
        title: publication.label,
        body: publication.title,
        url: publication.url(this.siteUrl),
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
