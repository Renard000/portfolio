const KEY = 'feed:v1';
const EMPTY = { items: {}, sections: {}, muted: false };

/**
 * Ce que ce visiteur a déjà vu, gardé dans son navigateur (stockage injecté).
 * Toute erreur de stockage (mode privé, quota) est ignorée.
 */
export default class SeenRepository {
  constructor(storage) {
    this.storage = storage;
  }

  load() {
    try {
      return { ...EMPTY, ...JSON.parse(this.storage.getItem(KEY) || '{}') };
    } catch {
      return { ...EMPTY };
    }
  }

  save(seen) {
    try {
      this.storage.setItem(KEY, JSON.stringify(seen));
    } catch {
      /* stockage indisponible : on ignore */
    }
  }
}
