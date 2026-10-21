export default class NewsletterSubscriber {
  constructor({
    id,
    email,
    active = true,
    confirmToken,
    unsubscribeToken,
    confirmedAt = null,
    unsubscribedAt = null,
    createdAt = null,
  }) {
    Object.assign(this, {
      id,
      email,
      active,
      confirmToken,
      unsubscribeToken,
      confirmedAt,
      unsubscribedAt,
      createdAt,
    });
  }

  isConfirmed() {
    return Boolean(this.confirmedAt);
  }

  /** Règle d'envoi : confirmé ET actif ET non désinscrit. */
  canReceive() {
    return this.isConfirmed() && this.active === true && !this.unsubscribedAt;
  }

  /** Version publiée vers l'admin : jamais les jetons secrets. */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      active: this.active,
      confirmed: this.isConfirmed(),
      confirmedAt: this.confirmedAt,
      unsubscribedAt: this.unsubscribedAt,
      createdAt: this.createdAt,
    };
  }
}
