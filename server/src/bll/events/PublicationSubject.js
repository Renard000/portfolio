const CHANNEL_LABELS = { email: 'courriels', push: 'push', feed: 'fil' };

const describe = (channel, r) =>
  `${CHANNEL_LABELS[channel] || channel} : ${r.sent} ok / ${r.failed} échecs` +
  (r.deactivated ? ` / ${r.deactivated} jetons désactivés` : '');

/**
 * Sujet du patron Observer : les services annoncent une Publication sans connaître
 * les canaux de diffusion. Un observateur expose `channel` et `onPublication(publication)` ;
 * ajouter un canal revient à l'abonner dans la composition root.
 */
export default class PublicationSubject {
  constructor({ logger = console } = {}) {
    this.observers = new Set();
    this.logger = logger;
  }

  /** Renvoie la fonction de désabonnement. */
  subscribe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Prévient tous les observateurs. Ne rejette jamais : la panne d'un canal
   * n'empêche ni les autres canaux, ni la publication elle-même.
   * @returns {Promise<Record<string, {sent:number, failed:number, deactivated:number}>>}
   */
  async notify(publication) {
    const observers = [...this.observers];
    const settled = await Promise.allSettled(
      observers.map(async (o) => o.onPublication(publication))
    );
    const results = {};
    settled.forEach((s, i) => {
      const { channel } = observers[i];
      if (s.status === 'fulfilled') results[channel] = s.value;
      else {
        this.logger.error(
          `[notifications] canal ${channel} en erreur : ${s.reason.message}`
        );
        results[channel] = { sent: 0, failed: 0, deactivated: 0, error: true };
      }
    });
    const summary = Object.entries(results)
      .map(([channel, r]) => describe(channel, r))
      .join(' ; ');
    this.logger.log(`[notifications] ${publication.kind} ${publication.id} — ${summary}`);
    return results;
  }

  /** Contenu dépublié ou supprimé ; ne rejette jamais, comme notify. */
  async retract(reference) {
    const settled = await Promise.allSettled(
      [...this.observers]
        .filter((o) => o.onRetraction)
        .map(async (o) => o.onRetraction(reference))
    );
    for (const s of settled)
      if (s.status === 'rejected')
        this.logger.error(`[notifications] retrait en erreur : ${s.reason.message}`);
  }
}
