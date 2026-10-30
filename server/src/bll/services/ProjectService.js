import { NotFoundError, ValidationError } from '../../domain/errors/index.js';
import Publication from '../../domain/entities/Publication.js';

const isDuplicate = (err) => /duplicate key|unique/i.test(err.message || '');

export default class ProjectService {
  constructor(projectRepository, publications = null) {
    this.projectRepository = projectRepository;
    this.publications = publications;
  }

  list() {
    return this.projectRepository.list();
  }

  /** notify : décoché dans l'admin pour ajouter un ancien contenu sans écrire aux abonnés. */
  async create({ notify = true, ...dto }) {
    let created;
    try {
      created = await this.projectRepository.create(dto);
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de projet est déjà utilisé');
      throw err;
    }
    if (notify && this.publications)
      await this.publications.notify(Publication.fromProject(created));
    return created;
  }

  async update(id, dto) {
    try {
      const updated = await this.projectRepository.update(id, dto);
      if (!updated) throw new NotFoundError('Projet introuvable');
      return updated;
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de projet est déjà utilisé');
      throw err;
    }
  }

  async remove(id) {
    if (!(await this.projectRepository.delete(id)))
      throw new NotFoundError('Projet introuvable');
  }
}
