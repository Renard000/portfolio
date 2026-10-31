import { interpolate } from '../../domain/translation.js';

const FORMATS = { fr: 'fr-CA', en: 'en-CA' };

/** Langue du site : le français sert de clé ; un texte non traduit reste en français. */
export default class LocaleService {
  constructor(localeRepository, dictionaries, reload) {
    this.repo = localeRepository;
    this.dictionaries = dictionaries;
    this.reload = reload;
    this.lang = localeRepository.get();
    this.locale = FORMATS[this.lang];
    const dictionary = dictionaries[this.lang] || {};
    this.t = (key, values) => interpolate(dictionary[key] ?? key, values);
  }

  /** Tout le site se recharge : contenus et API repartent dans la nouvelle langue. */
  toggle() {
    this.repo.set(this.lang === 'fr' ? 'en' : 'fr');
    this.reload();
  }
}
