/** Message reçu par le formulaire de contact (table messages). */
export default class Message {
  constructor({
    id,
    nom,
    email,
    sujet = null,
    message,
    lu = false,
    repliedAt = null,
    createdAt = null,
  }) {
    Object.assign(this, {
      id,
      nom,
      email,
      sujet,
      message,
      lu: Boolean(lu),
      repliedAt,
      createdAt,
    });
  }

  isRead() {
    return this.lu;
  }
}
