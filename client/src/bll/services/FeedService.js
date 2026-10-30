/** Page du menu où apparaît le point rouge, selon le type de publication. */
const SECTIONS = {
  article: '/blog',
  project: '/projets',
  video: '/formations',
  series: '/formations',
  certification: '/certifications',
  award: '/distinctions',
};
const SECTION_PATHS = [...new Set(Object.values(SECTIONS))];

export const LABELS = {
  article: 'Nouvel article',
  project: 'Nouveau projet',
  video: 'Nouvelle vidéo',
  series: 'Nouvelle formation',
  certification: 'Nouvelle certification',
  award: 'Nouvelle distinction',
};

const fromRow = (r) => ({
  id: r.id,
  kind: r.kind,
  refId: r.ref_id,
  title: r.title,
  path: r.path,
  publishedAt: r.published_at,
});

/** Nouveautés du site pour ce visiteur : fil de l'API, temps réel et mémoire du navigateur. */
export default class FeedService {
  constructor(emailAdminRepository, seenRepository, realtimeClient) {
    this.api = emailAdminRepository;
    this.seenRepository = seenRepository;
    this.realtime = realtimeClient;
  }

  list() {
    return this.api.listPublications();
  }

  loadSeen() {
    return this.seenRepository.load();
  }

  saveSeen(seen) {
    this.seenRepository.save(seen);
  }

  subscribe(callback) {
    return this.realtime.onInsert('publications', (row) => callback(fromRow(row)));
  }

  /** Publications non ouvertes, et pages du menu à signaler par un point rouge. */
  static newIndex(items, seen) {
    const index = { keys: {}, paths: [], dots: {} };
    for (const item of items) {
      if (seen.items[item.id]) continue;
      index.keys[`${item.kind}:${item.refId}`] = true;
      index.keys[item.path] = true;
      index.paths.push(item.path);
      const section = SECTIONS[item.kind];
      const visitedAt = new Date(seen.sections[section] || 0);
      if (new Date(item.publishedAt) > visitedAt) index.dots[section] = true;
    }
    return index;
  }

  static isNew(index, { key, path, prefix }) {
    if (key && index.keys[key]) return true;
    if (path && index.keys[path]) return true;
    return Boolean(prefix) && index.paths.some((p) => p.startsWith(prefix));
  }

  /**
   * Ouvrir une page du menu retire son point ; ouvrir une publication (et ce qu'elle
   * contient, comme les vidéos d'une formation) retire son badge.
   */
  static visit(seen, items, pathname, now = new Date()) {
    if (SECTION_PATHS.includes(pathname))
      return {
        ...seen,
        sections: { ...seen.sections, [pathname]: now.toISOString() },
      };
    const opened = items.filter(
      (i) =>
        pathname !== '/' && (i.path === pathname || i.path.startsWith(`${pathname}/`))
    );
    return FeedService.markSeen(seen, opened);
  }

  static markSeen(seen, items) {
    if (!items.length) return seen;
    const seenItems = { ...seen.items };
    for (const item of items) seenItems[item.id] = true;
    return { ...seen, items: seenItems };
  }

  static toToast(item) {
    return {
      title: LABELS[item.kind] || 'Nouveauté',
      text: item.title,
      to: item.path,
    };
  }
}
