export const LEVEL_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/** Modèles Domain : aucune dépendance, fonctions pures. */
export default class Video {
  /** 1590 → « 26:30 » ; 3725 → « 1:02:05 ». */
  static formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  }

  /** Durée totale lisible : « 3 h 20 », « 45 min », « 0 min ». */
  static formatTotal(seconds) {
    const minutes = Math.round((Number(seconds) || 0) / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
  }

  /** « 26:30 » ou « 1:02:05 » → secondes ; null si le format est invalide. */
  static parseDuration(text) {
    const parts = String(text || '')
      .trim()
      .split(':');
    if (
      parts.length < 2 ||
      parts.length > 3 ||
      parts.some((p) => !/^\d{1,2}$/.test(p) && !/^\d+$/.test(p))
    )
      return null;
    const n = parts.map(Number);
    if (n.slice(1).some((x) => x > 59)) return null;
    return n.reduce((acc, x) => acc * 60 + x, 0);
  }

  /** Indice du chapitre en cours (le dernier dont t ≤ temps), -1 s'il n'y en a pas. */
  static chapterIndexAt(chapters, time) {
    let idx = -1;
    (chapters || []).forEach((c, i) => {
      if (c.t <= time) idx = i;
    });
    return idx;
  }

  static levelLabel(level) {
    return LEVEL_LABELS[level] || level;
  }
}
