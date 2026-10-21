const asData = (r) => ({
  items: (r && r.items) || [],
  totals: (r && r.totals) || { count: 0, scholarshipAmounts: {} },
});

export default class AwardService {
  constructor(awardRepository) {
    this.repo = awardRepository;
  }

  async list() {
    return asData(await this.repo.list());
  }
  create(dto) {
    return this.repo.create(dto);
  }
  update(id, dto) {
    return this.repo.update(id, dto);
  }
  remove(id) {
    return this.repo.remove(id);
  }

  static filterByType(items, type) {
    return !type || type === 'all' ? items : items.filter((a) => a.type === type);
  }

  /** Groupe par année, la plus récente d'abord : [{ year, items }]. */
  static groupByYear(items) {
    const map = new Map();
    for (const a of items) {
      const year = Number(String(a.awardedAt).slice(0, 4));
      if (!map.has(year)) map.set(year, []);
      map.get(year).push(a);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => ({
        year,
        items: [...list].sort((a, b) =>
          String(b.awardedAt).localeCompare(String(a.awardedAt))
        ),
      }));
  }

  /** Nombre de distinctions + montant cumulé des bourses par devise (en centièmes). */
  static computeTotals(items) {
    const cents = {};
    for (const a of items) {
      if (a.type === 'scholarship' && a.amount !== null && a.amount !== undefined) {
        cents[a.currency || 'CAD'] =
          (cents[a.currency || 'CAD'] || 0) + Math.round(Number(a.amount) * 100);
      }
    }
    return {
      count: items.length,
      scholarshipAmounts: Object.fromEntries(
        Object.entries(cents).map(([cur, c]) => [cur, c / 100])
      ),
    };
  }

  static validate(values) {
    if (!String(values.title || '').trim()) return 'Le titre est obligatoire.';
    if (!String(values.organization || '').trim()) return "L'organisme est obligatoire.";
    if (!values.awardedAt) return 'La date est obligatoire.';
    if (values.amount !== '' && values.amount !== null && !(Number(values.amount) >= 0))
      return 'Le montant doit être un nombre positif.';
    return null;
  }

  static toDto(values, urls = {}) {
    const text = (v) => {
      const t = String(v ?? '').trim();
      return t === '' ? null : t;
    };
    const hasAmount =
      values.amount !== '' && values.amount !== null && values.amount !== undefined;
    return {
      title: values.title.trim(),
      type: values.type || 'award',
      organization: values.organization.trim(),
      description: text(values.description),
      amount: hasAmount ? Number(values.amount) : null,
      currency: (text(values.currency) || 'CAD').toUpperCase(),
      awardedAt: values.awardedAt,
      imageUrl: urls.imageUrl ?? text(values.imageUrl),
      documentUrl: urls.documentUrl ?? text(values.documentUrl),
      featured: Boolean(values.featured),
      sortOrder: parseInt(values.sortOrder, 10) || 0,
    };
  }
}
