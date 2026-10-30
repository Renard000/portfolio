const enc = encodeURIComponent;
const brief = (text) => (text ? String(text).slice(0, 200) : null);

/** Libellé affiché dans le sujet des courriels et le titre des notifications push. */
export const PUBLICATION_LABELS = {
  article: 'Nouvel article',
  video: 'Nouvelle vidéo',
  series: 'Nouvelle formation',
  certification: 'Nouvelle certification',
  award: 'Nouvelle distinction',
  project: 'Nouveau projet',
};

/**
 * Événement « un contenu vient d'être publié », commun à tous les types de contenu.
 * `path` est relatif au site : chaque observateur construit l'adresse complète.
 */
export default class Publication {
  constructor({ kind, id, title, excerpt = null, path }) {
    Object.assign(this, { kind, id, title, excerpt, path });
  }

  get label() {
    return PUBLICATION_LABELS[this.kind];
  }

  url(siteUrl) {
    return `${siteUrl}${this.path}`;
  }

  static fromArticle(a) {
    return new Publication({
      kind: 'article',
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      path: `/blog/${enc(a.slug)}`,
    });
  }

  static fromVideo(v, series) {
    return new Publication({
      kind: 'video',
      id: v.id,
      title: v.title,
      excerpt: brief(v.description),
      path: `/formations/${enc(series.slug)}/${enc(v.slug)}`,
    });
  }

  static fromSeries(s) {
    return new Publication({
      kind: 'series',
      id: s.id,
      title: s.title,
      excerpt: brief(s.description),
      path: `/formations/${enc(s.slug)}`,
    });
  }

  static fromCertification(c) {
    return new Publication({
      kind: 'certification',
      id: c.id,
      title: c.title,
      excerpt: c.issuer,
      path: '/certifications',
    });
  }

  static fromAward(a) {
    return new Publication({
      kind: 'award',
      id: a.id,
      title: a.title,
      excerpt: a.organization,
      path: '/distinctions',
    });
  }

  static fromProject(p) {
    return new Publication({
      kind: 'project',
      id: p.id,
      title: p.title,
      excerpt: brief(p.summary || p.description),
      path: `/projets/${enc(p.slug)}`,
    });
  }
}
