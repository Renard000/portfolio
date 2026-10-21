export default class AwardController {
  constructor(awardService) {
    this.service = awardService;
  }

  async list(req, res) {
    res.json(await this.service.listWithTotals());
  }

  async create(req, res) {
    res.status(201).json(await this.service.create(req.validated.body));
  }

  async update(req, res) {
    res.json(await this.service.update(req.validated.params.id, req.validated.body));
  }

  async remove(req, res) {
    await this.service.remove(req.validated.params.id);
    res.status(204).end();
  }
}
