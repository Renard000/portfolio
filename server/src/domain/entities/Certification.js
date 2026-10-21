/** Date du jour au format AAAA-MM-JJ (les dates de la base n'ont pas d'heure). */
const toDay = (date) => date.toISOString().slice(0, 10);

export default class Certification {
  constructor({
    id,
    title,
    issuer,
    category = null,
    description = null,
    issueDate,
    expiryDate = null,
    credentialId = null,
    credentialUrl = null,
    imageUrl = null,
    documentUrl = null,
    skills = [],
    featured = false,
    sortOrder = 0,
    createdAt = null,
  }) {
    Object.assign(this, {
      id,
      title,
      issuer,
      category,
      description,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      imageUrl,
      documentUrl,
      skills: skills || [],
      featured: Boolean(featured),
      sortOrder: sortOrder ?? 0,
      createdAt,
    });
  }

  /** Expirée si la date d'expiration est strictement avant aujourd'hui. */
  isExpired(now = new Date()) {
    return Boolean(this.expiryDate) && this.expiryDate < toDay(now);
  }

  /** 'valid' | 'expired' | 'no-expiry' (badge Valide / Expirée / Sans expiration). */
  status(now = new Date()) {
    if (!this.expiryDate) return 'no-expiry';
    return this.isExpired(now) ? 'expired' : 'valid';
  }

  toJSON() {
    return { ...this, status: this.status() };
  }
}
