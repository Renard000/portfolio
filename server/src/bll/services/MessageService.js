import { NotFoundError } from '../../domain/errors/index.js';
import { fill, replyEmail } from '../emails.js';

/** Messages reçus par le formulaire de contact : lecture et suivi (admin). */
export default class MessageService {
  constructor(
    messageRepository,
    { emailClient, templates, sender, replyTo, clock = () => new Date() } = {}
  ) {
    this.messageRepository = messageRepository;
    this.emailClient = emailClient;
    this.templates = templates;
    this.sender = sender;
    this.replyTo = replyTo;
    this.clock = clock;
  }

  async #find(id) {
    const message = await this.messageRepository.findById(id);
    if (!message) throw new NotFoundError('Message introuvable');
    return message;
  }

  /** Texte proposé à l'admin, à adapter avant l'envoi. */
  async replyDraft(id) {
    const message = await this.#find(id);
    const template = await this.templates.get('reply');
    const variables = {
      nom: message.nom,
      sujet: message.sujet || 'votre message',
    };
    return {
      subject: fill(template.subject, variables),
      body: fill(template.body, variables),
    };
  }

  /** Répond depuis l'admin : le destinataire peut répondre directement à replyTo. */
  async reply(id, { subject, body }) {
    const message = await this.#find(id);
    const template = await this.templates.get('reply');
    await this.emailClient.send({
      to: message.email,
      replyTo: this.replyTo,
      ...replyEmail({
        template: { ...template, subject, body },
        message,
        sender: this.sender,
      }),
    });
    return this.messageRepository.markReplied(id, this.clock().toISOString());
  }

  listAll() {
    return this.messageRepository.listAll();
  }

  async setRead(id, lu) {
    const message = await this.messageRepository.setRead(id, lu);
    if (!message) throw new NotFoundError('Message introuvable');
    return message;
  }

  async remove(id) {
    if (!(await this.messageRepository.delete(id)))
      throw new NotFoundError('Message introuvable');
  }
}
