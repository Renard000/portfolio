export const AWARD_TYPE_LABELS = {
  scholarship: 'Bourse',
  merit: 'Mérite',
  award: 'Prix',
  honor: 'Honneur',
};

export default class Award {
  constructor(json) {
    // L'API ajoute `year` : c'est un getter ici (assigner une propriété getter-only lève une erreur).
    const data = { ...json };
    delete data.year;
    Object.assign(this, { currency: 'CAD', amount: null }, data);
  }

  get year() {
    return Number(String(this.awardedAt).slice(0, 4));
  }

  typeLabel() {
    return AWARD_TYPE_LABELS[this.type] || this.type;
  }

  hasAmount() {
    return this.amount !== null && this.amount !== undefined;
  }

  formattedAmount(locale = 'fr-CA') {
    if (!this.hasAmount()) return '';
    return Award.formatMoney(this.amount, this.currency, locale);
  }

  static formatMoney(amount, currency = 'CAD', locale = 'fr-CA') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }
}
