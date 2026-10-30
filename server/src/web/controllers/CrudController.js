/** Contrôleur générique liste + CRUD (projets, compétences) : service list/create/update/remove. */
export default class CrudController {
  constructor(service) {
    this.service = service;
  }

  async list(req, res) {
    res.json(await this.service.list());
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
