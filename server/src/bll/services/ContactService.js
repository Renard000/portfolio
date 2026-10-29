import { contactNotificationEmail } from '../emails.js';

export default class ContactService {
  /**
   * @param notifyTo adresse qui reçoit une copie par courriel (facultatif)
   */
  constructor(contactRepository, emailClient, { notifyTo = '', logger = console } = {}) {
    this.repo = contactRepository;
    this.emailClient = emailClient;
    this.notifyTo = notifyTo;
    this.logger = logger;
  }

  /** Honeypot rempli : réponse identique, rien d'écrit, rien d'envoyé. */
  async send({ nom, email, sujet, message, website }) {
    if (website) return { status: 'received' };
    await this.repo.create({ nom, email, sujet, message });
    if (this.notifyTo) {
      try {
        await this.emailClient.send({
          to: this.notifyTo,
          ...contactNotificationEmail({ nom, email, sujet, message }),
        });
      } catch (err) {
        // Le message est déjà enregistré : une panne de courriel ne doit pas faire échouer la demande.
        this.logger.error(`[contact] notification non envoyée : ${err.message}`);
      }
    }
    return { status: 'received' };
  }
}
