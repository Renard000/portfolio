export default class PushSubscriptionService {
  constructor(pushSubscriptionRepository) {
    this.repo = pushSubscriptionRepository;
  }

  async subscribe(token) {
    await this.repo.upsert(token);
    return { status: 'subscribed' };
  }
}
