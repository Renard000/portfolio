import { NotFoundError } from '../../domain/errors/index.js';

/** Messages reçus par le formulaire de contact : lecture et suivi (admin). */
export default class MessageService {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
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
