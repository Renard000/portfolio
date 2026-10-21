export const AWARD_TYPES = ['scholarship', 'merit', 'award', 'honor'];

export default class Award {
  constructor({
    id,
    title,
    type = 'award',
    organization,
    description = null,
    amount = null,
    currency = 'CAD',
    awardedAt,
    imageUrl = null,
    documentUrl = null,
    featured = false,
    sortOrder = 0,
    createdAt = null,
  }) {
    Object.assign(this, {
      id,
      title,
      type,
      organization,
      description,
      amount: amount === null || amount === undefined ? null : Number(amount),
      currency: currency || 'CAD',
      awardedAt,
      imageUrl,
      documentUrl,
      featured: Boolean(featured),
      sortOrder: sortOrder ?? 0,
      createdAt,
    });
  }

  isScholarship() {
    return this.type === 'scholarship';
  }

  hasAmount() {
    return this.amount !== null && !Number.isNaN(this.amount);
  }

  get year() {
    return Number(String(this.awardedAt).slice(0, 4));
  }

  toJSON() {
    return { ...this, year: this.year };
  }
}
