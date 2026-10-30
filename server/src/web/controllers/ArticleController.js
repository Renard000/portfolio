/** Blog public : liste, détail, vues, likes et commentaires. */
export default class ArticleController {
  constructor(articleService, commentService) {
    this.articleService = articleService;
    this.commentService = commentService;
  }

  async list(req, res) {
    res.json(await this.articleService.listPublished(req.validated.query));
  }

  async get(req, res) {
    res.json(await this.articleService.getPublished(req.validated.params.slug));
  }

  async view(req, res) {
    await this.articleService.view(req.validated.params.id);
    res.status(204).end();
  }

  async like(req, res) {
    res.json(await this.articleService.like(req.validated.params.id));
  }

  async comment(req, res) {
    res
      .status(202)
      .json(
        await this.commentService.submit(req.validated.params.id, req.validated.body)
      );
  }
}
