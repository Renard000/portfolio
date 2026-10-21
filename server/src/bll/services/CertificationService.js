import { NotFoundError } from '../../domain/errors/index.js';

/** Minuscules sans accents : « Sécurité » trouve « securite ». */
export const normalize = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default class CertificationService {
  constructor(certificationRepository) {
    this.certificationRepository = certificationRepository;
  }

  /** Filtres : issuer, category (égalité), q (texte libre), featured, sort. */
  async list({ issuer, category, q, featured, sort } = {}) {
    let items = await this.certificationRepository.list();
    if (issuer) items = items.filter((c) => normalize(c.issuer) === normalize(issuer));
    if (category)
      items = items.filter((c) => normalize(c.category) === normalize(category));
    if (featured === 'true' || featured === true) items = items.filter((c) => c.featured);
    if (q) {
      const needle = normalize(q);
      items = items.filter((c) =>
        [c.title, c.issuer, c.category, c.description, ...(c.skills || [])].some(
          (field) => normalize(field).includes(needle)
        )
      );
    }
    if (sort === 'date_desc' || sort === 'date_asc') {
      const dir = sort === 'date_asc' ? 1 : -1;
      items = [...items].sort((a, b) => dir * a.issueDate.localeCompare(b.issueDate));
    }
    return items;
  }

  create(dto) {
    return this.certificationRepository.create(dto);
  }

  async update(id, dto) {
    const updated = await this.certificationRepository.update(id, dto);
    if (!updated) throw new NotFoundError('Certification introuvable');
    return updated;
  }

  async remove(id) {
    const deleted = await this.certificationRepository.delete(id);
    if (!deleted) throw new NotFoundError('Certification introuvable');
  }
}
