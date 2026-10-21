const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default class NewsletterService {
  constructor(newsletterRepository) {
    this.repo = newsletterRepository;
  }

  /** Validation côté client (confort) ; le serveur revalide toujours. */
  static validate({ email, consent }) {
    const errors = {};
    if (!EMAIL_RE.test(String(email || '').trim()))
      errors.email = 'Adresse courriel invalide.';
    if (consent !== true) errors.consent = 'Veuillez accepter de recevoir les courriels.';
    return errors;
  }

  async subscribe({ email, consent, website = '' }) {
    const errors = NewsletterService.validate({ email, consent });
    if (Object.keys(errors).length) {
      const err = new Error(Object.values(errors)[0]);
      err.fields = errors;
      throw err;
    }
    return this.repo.subscribe({ email: email.trim(), consent: true, website });
  }
}
