import { NotFoundError } from '../../domain/errors/index.js';

export default class SubscriberAdminService {
  constructor(newsletterRepository, pushSubscriptionRepository) {
    this.newsletterRepository = newsletterRepository;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
  }

  async listAll() {
    const [newsletter, push] = await Promise.all([
      this.newsletterRepository.listAll(),
      this.pushSubscriptionRepository.listAll(),
    ]);
    return { newsletter, push };
  }

  async removeNewsletter(id) {
    if (!(await this.newsletterRepository.delete(id)))
      throw new NotFoundError('Abonné introuvable');
  }

  async removePush(id) {
    if (!(await this.pushSubscriptionRepository.delete(id)))
      throw new NotFoundError('Abonnement push introuvable');
  }
}
