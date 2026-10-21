import { NotFoundError } from '../../domain/errors/index.js';

export default class AwardService {
  constructor(awardRepository) {
    this.awardRepository = awardRepository;
  }

  /** Liste triée (plus récente d'abord) + totaux calculés ici, jamais dans la vue. */
  async listWithTotals() {
    const items = [...(await this.awardRepository.list())].sort(
      (a, b) => b.awardedAt.localeCompare(a.awardedAt) || a.sortOrder - b.sortOrder
    );
    return { items, totals: AwardService.computeTotals(items) };
  }

  /**
   * count : nombre de distinctions.
   * scholarshipAmounts : montant cumulé des BOURSES par devise (en centièmes
   * pour éviter les erreurs d'arrondi des décimaux).
   */
  static computeTotals(items) {
    const cents = {};
    for (const a of items) {
      if (a.type === 'scholarship' && a.amount !== null && a.amount !== undefined) {
        cents[a.currency] = (cents[a.currency] || 0) + Math.round(Number(a.amount) * 100);
      }
    }
    const scholarshipAmounts = Object.fromEntries(
      Object.entries(cents).map(([cur, c]) => [cur, c / 100])
    );
    return { count: items.length, scholarshipAmounts };
  }

  create(dto) {
    return this.awardRepository.create(dto);
  }

  async update(id, dto) {
    const updated = await this.awardRepository.update(id, dto);
    if (!updated) throw new NotFoundError('Distinction introuvable');
    return updated;
  }

  async remove(id) {
    const deleted = await this.awardRepository.delete(id);
    if (!deleted) throw new NotFoundError('Distinction introuvable');
  }
}
