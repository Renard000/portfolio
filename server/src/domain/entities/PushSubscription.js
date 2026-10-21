export default class PushSubscription {
  constructor({ id, fcmToken, active = true, createdAt = null }) {
    Object.assign(this, { id, fcmToken, active, createdAt });
  }

  /** Jeton tronqué pour l'affichage admin (le jeton complet reste sur le serveur). */
  get maskedToken() {
    const t = this.fcmToken || '';
    return t.length <= 12 ? '…' : `${t.slice(0, 6)}…${t.slice(-4)}`;
  }

  toJSON() {
    return {
      id: this.id,
      token: this.maskedToken,
      active: this.active,
      createdAt: this.createdAt,
    };
  }
}
