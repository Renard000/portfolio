export default class SubscriberAdminService {
  constructor(repo) {
    this.repo = repo;
  }
  async list() {
    const r = await this.repo.list();
    return { newsletter: (r && r.newsletter) || [], push: (r && r.push) || [] };
  }
  removeNewsletter(id) {
    return this.repo.removeNewsletter(id);
  }
  removePush(id) {
    return this.repo.removePush(id);
  }
  sendTestEmail(to) {
    return this.repo.sendTestEmail(to);
  }
}
