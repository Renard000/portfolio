const text = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};
const list = (v, sep = ',') => [
  ...new Set(
    String(v || '')
      .split(sep)
      .map((x) => x.trim())
      .filter(Boolean)
  ),
];

/** CRUD admin des projets et des compétences (repositories injectés). */
export default class PortfolioAdminService {
  constructor(projectRepository, skillRepository) {
    this.projectRepository = projectRepository;
    this.skillRepository = skillRepository;
  }

  listProjects() {
    return this.projectRepository.list();
  }
  saveProject(id, dto) {
    return id
      ? this.projectRepository.update(id, dto)
      : this.projectRepository.create(dto);
  }
  removeProject(id) {
    return this.projectRepository.remove(id);
  }

  listSkills() {
    return this.skillRepository.list();
  }
  saveSkill(id, dto) {
    return id ? this.skillRepository.update(id, dto) : this.skillRepository.create(dto);
  }
  removeSkill(id) {
    return this.skillRepository.remove(id);
  }

  static validateProject(values) {
    if (!String(values.title || '').trim()) return 'Le titre est obligatoire.';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug || ''))
      return 'Slug invalide : minuscules, chiffres et tirets uniquement.';
    if (values.color && !/^#[0-9a-fA-F]{6}$/.test(values.color))
      return 'Couleur attendue au format #RRGGBB.';
    return null;
  }

  static toProjectDto(values, urls = {}) {
    return {
      slug: values.slug,
      title: values.title.trim(),
      category: text(values.category),
      summary: text(values.summary),
      challenge: text(values.challenge),
      solution: text(values.solution),
      role: text(values.role),
      duration: text(values.duration),
      year: text(values.year),
      tech: list(values.tech),
      // Un indicateur par ligne
      results: list(values.results, '\n'),
      githubUrl: text(values.githubUrl),
      liveUrl: text(values.liveUrl),
      imageUrl: urls.imageUrl ?? text(values.imageUrl),
      color: text(values.color),
      featured: Boolean(values.featured),
      sortOrder: parseInt(values.sortOrder, 10) || 0,
    };
  }

  static validateSkill(values) {
    if (!String(values.name || '').trim()) return 'Le nom est obligatoire.';
    const level = Number(values.level);
    if (!Number.isInteger(level) || level < 0 || level > 100)
      return 'Le niveau doit être un entier entre 0 et 100.';
    return null;
  }

  static toSkillDto(values) {
    return {
      name: values.name.trim(),
      level: Number(values.level),
      icon: text(values.icon),
      sortOrder: parseInt(values.sortOrder, 10) || 0,
    };
  }
}
