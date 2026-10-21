export default class SubscriberAdminController {
  constructor(subscriberAdminService, newsletterService) {
    this.service = subscriberAdminService;
    this.newsletterService = newsletterService;
  }

  async list(req, res) {
    res.json(await this.service.listAll());
  }

  async removeNewsletter(req, res) {
    await this.service.removeNewsletter(req.validated.params.id);
    res.status(204).end();
  }

  async removePush(req, res) {
    await this.service.removePush(req.validated.params.id);
    res.status(204).end();
  }

  async sendTestEmail(req, res) {
    await this.newsletterService.sendTest(req.validated.body.to);
    res.json({ status: 'sent' });
  }
}
