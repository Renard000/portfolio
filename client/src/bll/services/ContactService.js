const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default class ContactService {
  constructor(contactRepository) {
    this.repo = contactRepository;
  }

  /** Contrôles de confort côté client ; le serveur revalide toujours. */
  static validate({ nom, email, message }) {
    const errors = {};
    if (!String(nom || '').trim()) errors.nom = 'Votre nom est requis.';
    if (!EMAIL_RE.test(String(email || '').trim()))
      errors.email = 'Adresse courriel invalide.';
    if (String(message || '').trim().length < 10)
      errors.message = 'Votre message doit contenir au moins 10 caractères.';
    return errors;
  }

  async send({ nom, email, sujet = '', message, website = '' }) {
    const errors = ContactService.validate({ nom, email, message });
    if (Object.keys(errors).length) {
      const err = new Error(Object.values(errors)[0]);
      err.fields = errors;
      throw err;
    }
    return this.repo.send({
      nom: nom.trim(),
      email: email.trim(),
      sujet: sujet.trim(),
      message: message.trim(),
      website,
    });
  }
}
