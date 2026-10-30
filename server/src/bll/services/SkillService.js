import { NotFoundError } from '../../domain/errors/index.js';

export default class SkillService {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  list() {
    return this.skillRepository.list();
  }

  create(dto) {
    return this.skillRepository.create(dto);
  }

  async update(id, dto) {
    const updated = await this.skillRepository.update(id, dto);
    if (!updated) throw new NotFoundError('Compétence introuvable');
    return updated;
  }

  async remove(id) {
    if (!(await this.skillRepository.delete(id)))
      throw new NotFoundError('Compétence introuvable');
  }
}
