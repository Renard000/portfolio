const PREFIX = 'progress:v1:';

/**
 * Progression de lecture (position, vu) gardée dans le navigateur. Le stockage est INJECTÉ
 * (localStorage en production) et ce repository n'est jamais appelé par une vue.
 * Toute erreur de stockage (mode privé, quota) est ignorée : la lecture continue sans reprise.
 */
export default class ProgressRepository {
  constructor(storage) {
    this.storage = storage;
  }

  get(videoId) {
    try {
      const raw = this.storage.getItem(PREFIX + videoId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  set(videoId, value) {
    try {
      this.storage.setItem(
        PREFIX + videoId,
        JSON.stringify({ ...value, updatedAt: Date.now() })
      );
    } catch {
      /* stockage indisponible : on ignore */
    }
  }
}
