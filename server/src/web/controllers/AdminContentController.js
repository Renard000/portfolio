/**
 * Administration du contenu : articles, modération des commentaires, messages
 * et tableau de bord. Chaque méthode délègue au service concerné.
 */
export default class AdminContentController {
  constructor({ articleService, commentService, messageService, dashboardService }) {
    this.articles = articleService;
    this.comments = commentService;
    this.messages = messageService;
    this.dashboard = dashboardService;
  }

  // --- Tableau de bord ---
  async getDashboard(req, res) {
    res.json(await this.dashboard.get());
  }

  // --- Articles ---
  async listArticles(req, res) {
    res.json(await this.articles.listAll());
  }

  async getArticle(req, res) {
    res.json(await this.articles.getById(req.validated.params.id));
  }

  async createArticle(req, res) {
    res.status(201).json(await this.articles.create(req.validated.body));
  }

  async updateArticle(req, res) {
    res.json(await this.articles.update(req.validated.params.id, req.validated.body));
  }

  async deleteArticle(req, res) {
    await this.articles.remove(req.validated.params.id);
    res.status(204).end();
  }

  async publishArticle(req, res) {
    res.json(await this.articles.publish(req.validated.params.id));
  }

  async unpublishArticle(req, res) {
    res.json(await this.articles.unpublish(req.validated.params.id));
  }

  // --- Commentaires ---
  async listComments(req, res) {
    res.json(await this.comments.listAll());
  }

  async moderateComment(req, res) {
    res.json(
      await this.comments.setApproved(
        req.validated.params.id,
        req.validated.body.approved
      )
    );
  }

  async deleteComment(req, res) {
    await this.comments.remove(req.validated.params.id);
    res.status(204).end();
  }

  // --- Messages ---
  async listMessages(req, res) {
    res.json(await this.messages.listAll());
  }

  async markMessage(req, res) {
    res.json(await this.messages.setRead(req.validated.params.id, req.validated.body.lu));
  }

  async deleteMessage(req, res) {
    await this.messages.remove(req.validated.params.id);
    res.status(204).end();
  }
}
