const time = (value) => {
  const t = new Date(value ?? NaN).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Sélection des contenus ajoutés récemment, pour l'accueil. */
export default class RecentService {
  /** Les plus récents d'abord (sans date : en dernier, dans leur ordre d'origine). */
  static latest(items, { date = (i) => i.createdAt, count = 3 } = {}) {
    return items
      .map((item, index) => ({ item, index, at: time(date(item)) }))
      .sort((a, b) => b.at - a.at || a.index - b.index)
      .slice(0, count)
      .map(({ item }) => item);
  }
}
