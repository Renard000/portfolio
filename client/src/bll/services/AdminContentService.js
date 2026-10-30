const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** Tableau de bord, modération des commentaires et messages de contact. */
export default class AdminContentService {
  constructor(adminContentRepository) {
    this.repo = adminContentRepository;
  }

  dashboard() {
    return this.repo.dashboard();
  }

  listComments() {
    return this.repo.listComments();
  }
  moderateComment(id, approved) {
    return this.repo.moderateComment(id, approved);
  }
  removeComment(id) {
    return this.repo.removeComment(id);
  }

  listMessages() {
    return this.repo.listMessages();
  }
  markMessage(id, lu) {
    return this.repo.markMessage(id, lu);
  }
  removeMessage(id) {
    return this.repo.removeMessage(id);
  }

  /** 51600 s → « 14 h 20 » ; 600 s → « 10 min » */
  static formatDuration(seconds) {
    const total = Math.round((Number(seconds) || 0) / 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `${m} min`;
    return `${h} h ${String(m).padStart(2, '0')}`;
  }

  /**
   * Barres du graphique « Vues par mois » : hauteur relative au maximum (en %),
   * le mois record mis en évidence, libellés de mois courts.
   */
  static monthBars(viewsByMonth) {
    const list = viewsByMonth || [];
    const max = Math.max(0, ...list.map((m) => m.views));
    return list.map((m) => {
      const d = new Date(`${String(m.month).slice(0, 10)}T00:00:00`);
      return {
        key: String(m.month),
        label: MONTHS[d.getMonth()] || '',
        views: m.views,
        height: max ? Math.max(4, Math.round((m.views / max) * 100)) : 4,
        peak: max > 0 && m.views === max,
      };
    });
  }

  /** Compteurs de la barre latérale (pastilles) à partir des listes chargées. */
  static badges({ comments = [], messages = [] }) {
    return {
      comments: comments.filter((c) => !c.approved).length,
      messages: messages.filter((m) => !m.lu).length,
    };
  }
}
