/** Abonnement aux notifications : jeton FCM (messagingClient) → API. */
export default class PushService {
  constructor(messagingClient, newsletterRepository) {
    this.messagingClient = messagingClient;
    this.repo = newsletterRepository;
  }

  /** @returns 'subscribed' | 'unavailable' (non supporté ou permission refusée) */
  async enable() {
    const token = await this.messagingClient.getToken();
    if (!token) return 'unavailable';
    await this.repo.subscribePush(token);
    return 'subscribed';
  }
}
