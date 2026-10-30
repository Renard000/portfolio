/** Modèles de courriel, réponses aux messages et news envoyées depuis l'admin. */
export default class EmailAdminController {
  constructor({ emailTemplateService, messageService, newsletterService }) {
    this.templates = emailTemplateService;
    this.messages = messageService;
    this.newsletter = newsletterService;
  }

  async listTemplates(req, res) {
    res.json(await this.templates.list());
  }

  async saveTemplate(req, res) {
    res.json(await this.templates.save(req.validated.params.key, req.validated.body));
  }

  async resetTemplate(req, res) {
    res.json(await this.templates.reset(req.validated.params.key));
  }

  async preview(req, res) {
    res.json(this.templates.preview(req.validated.params.key, req.validated.body));
  }

  async sendTest(req, res) {
    const { to, ...dto } = req.validated.body;
    await this.templates.sendTest(req.validated.params.key, dto, to);
    res.json({ status: 'sent' });
  }

  async replyDraft(req, res) {
    res.json(await this.messages.replyDraft(req.validated.params.id));
  }

  async reply(req, res) {
    res.json(await this.messages.reply(req.validated.params.id, req.validated.body));
  }

  async broadcast(req, res) {
    res.json(await this.newsletter.broadcast(req.validated.body));
  }
}
