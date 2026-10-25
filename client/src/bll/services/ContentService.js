const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Profil et projets du portfolio. La source (fichier, API) est injectée. */
export default class ContentService {
  constructor(content) {
    this.content = content;
  }

  /** Version synchrone : sert à préremplir le store (aucun écran de chargement). */
  snapshot() {
    return { profile: this.content.profile, projects: this.content.projects };
  }

  async getAll() {
    return this.snapshot();
  }

  /** Catégories présentes, dans l'ordre d'apparition. */
  static categories(projects) {
    return [...new Set(projects.map((p) => p.category).filter(Boolean))];
  }

  /** category : '' ou 'all' = toutes ; q : recherche (titre, résumé, technologies). */
  static filterProjects(projects, { category = '', q = '' } = {}) {
    let out = projects;
    if (category && category !== 'all') out = out.filter((p) => p.category === category);
    if (q.trim()) {
      const needle = norm(q.trim());
      out = out.filter((p) =>
        [p.title, p.summary, p.category, ...(p.tech || [])].some((f) =>
          norm(f).includes(needle)
        )
      );
    }
    return out;
  }

  static findBySlug(projects, slug) {
    return projects.find((p) => p.slug === slug) || null;
  }

  /** Projet suivant (en boucle) ; null s'il n'y a qu'un seul projet. */
  static next(projects, slug) {
    const i = projects.findIndex((p) => p.slug === slug);
    if (i < 0 || projects.length < 2) return null;
    return projects[(i + 1) % projects.length];
  }
}
