const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Enveloppe de Firebase Admin (FCM). Reçoit une fonction qui fournit l'objet
 * messaging : l'initialisation est paresseuse et injectable dans les tests.
 */
export default class FirebaseAdmin {
  constructor(getMessaging) {
    this.getMessaging = getMessaging;
  }

  /**
   * Envoie une notification (500 jetons maximum par appel FCM).
   * @returns {{successCount:number, failureCount:number, invalidTokens:string[]}}
   */
  async sendToTokens(tokens, { title, body, url }) {
    if (!tokens.length) return { successCount: 0, failureCount: 0, invalidTokens: [] };
    const response = await this.getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link: url } },
      data: { url },
    });
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error && INVALID_TOKEN_CODES.has(r.error.code)) {
        invalidTokens.push(tokens[i]);
      }
    });
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  }
}
