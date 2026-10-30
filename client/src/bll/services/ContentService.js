const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const PALETTE = ['#3b2f8f', '#0f5e4d', '#8a3a24', '#24507a', '#6b3b8f'];
const SHAPE_COUNT = 3;

/**
 * Profil et projets du portfolio. Le fichier local sert de contenu initial et de repli ;
 * les projets et compétences gérés depuis l'admin (API) le remplacent dès qu'ils existent.
 */
export default class ContentService {
  constructor(content, { projectRepository = null, skillRepository = null } = {}) {
    this.content = content;
    this.projectRepository = projectRepository;
    this.skillRepository = skillRepository;
  }

  /** Version synchrone : sert à préremplir le store (aucun écran de chargement). */
  snapshot() {
    return { profile: this.content.profile, projects: this.content.projects };
  }

  /** Contenu de l'API si disponible et non vide, sinon celui du fichier (panne incluse). */
  async getAll() {
    const local = this.snapshot();
    const [projects, skills] = await Promise.all([
      this.#fetch(this.projectRepository),
      this.#fetch(this.skillRepository),
    ]);
    return {
      profile:
        skills && skills.length
          ? {
              ...local.profile,
              skills: skills.map((s) => ({ name: s.name, level: s.level })),
            }
          : local.profile,
      projects:
        projects && projects.length
          ? projects.map((p, i) => ContentService.fromApiProject(p, i))
          : local.projects,
    };
  }

  async #fetch(repository) {
    if (!repository) return null;
    try {
      return await repository.list();
    } catch {
      return null;
    }
  }

  /** Projet de l'API → forme attendue par les vues (couleur et vignette par défaut). */
  static fromApiProject(p, index = 0) {
    return {
      ...p,
      summary: p.summary || p.description || '',
      tech: p.tech || [],
      results: p.results || [],
      color: p.color || PALETTE[index % PALETTE.length],
      kind: index % SHAPE_COUNT,
    };
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
