const today = (now) => now.toISOString().slice(0, 10);

/** Modèle Domain : aucune dépendance. Construit à partir du JSON de l'API. */
export default class Certification {
  constructor(json) {
    // L'API ajoute `status` (valeur calculée à l'instant de la requête) : on l'écarte,
    // sinon elle masquerait la méthode status() qui recalcule à la date du jour.
    const data = { ...json };
    delete data.status;
    Object.assign(this, { skills: [], featured: false }, data);
  }

  isExpired(now = new Date()) {
    return Boolean(this.expiryDate) && this.expiryDate < today(now);
  }

  /** 'valid' | 'expired' | 'no-expiry' */
  status(now = new Date()) {
    if (!this.expiryDate) return 'no-expiry';
    return this.isExpired(now) ? 'expired' : 'valid';
  }

  statusLabel(now = new Date()) {
    return { valid: 'Valide', expired: 'Expirée', 'no-expiry': 'Sans expiration' }[
      this.status(now)
    ];
  }

  /** « 15 mars 2024 » (dates sans heure : on évite le décalage de fuseau). */
  static formatDate(iso, locale = 'fr-CA') {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, d)));
  }

  formattedIssueDate() {
    return Certification.formatDate(this.issueDate);
  }

  isPdfDocument() {
    return Boolean(this.documentUrl) && /\.pdf($|\?)/i.test(this.documentUrl);
  }
}
