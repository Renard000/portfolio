export default class PublicationController {
  constructor(publicationFeedService) {
    this.service = publicationFeedService;
  }

  async list(req, res) {
    res.json(await this.service.list());
  }
}
