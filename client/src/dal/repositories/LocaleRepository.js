const KEY = 'locale:v1';

/** Langue choisie par le visiteur (stockage injecté), sinon celle de son navigateur. */
export default class LocaleRepository {
  constructor(storage, browserLanguage = 'fr') {
    this.storage = storage;
    this.browserLanguage = browserLanguage;
  }

  get() {
    try {
      const saved = this.storage.getItem(KEY);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch {
      /* stockage indisponible : on suit le navigateur */
    }
    return String(this.browserLanguage).toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  set(lang) {
    try {
      this.storage.setItem(KEY, lang);
    } catch {
      /* stockage indisponible : le choix n'est pas retenu */
    }
  }
}
