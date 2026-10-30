import { withScheme } from '../../domain/url.js';
/** Minuscules sans accents. */
const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const asList = (r) => (Array.isArray(r) ? r : (r && r.items) || []);

export default class CertificationService {
  constructor(certificationRepository) {
    this.repo = certificationRepository;
  }

  async list(params = {}) {
    return asList(await this.repo.list(params));
  }
  create(dto) {
    return this.repo.create(dto);
  }
  update(id, dto) {
    return this.repo.update(id, dto);
  }
  remove(id) {
    return this.repo.remove(id);
  }

  /** Filtres de la page (recherche, émetteur, catégorie) puis tri par date. */
  static filterAndSort(
    items,
    { q = '', issuer = '', category = '', sort = 'date_desc' } = {}
  ) {
    let out = items;
    if (issuer) out = out.filter((c) => c.issuer === issuer);
    if (category) out = out.filter((c) => c.category === category);
    if (q.trim()) {
      const needle = norm(q.trim());
      out = out.filter((c) =>
        [c.title, c.issuer, c.category, c.description, ...(c.skills || [])].some((f) =>
          norm(f).includes(needle)
        )
      );
    }
    const dir = sort === 'date_asc' ? 1 : -1;
    return [...out].sort(
      (a, b) => dir * String(a.issueDate).localeCompare(String(b.issueDate))
    );
  }

  /** Valeurs distinctes pour alimenter les listes de filtres. */
  static facets(items) {
    const uniq = (key) =>
      [...new Set(items.map((c) => c[key]).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'fr')
      );
    return { issuers: uniq('issuer'), categories: uniq('category') };
  }

  static featured(items) {
    return items.filter((c) => c.featured);
  }

  /** Contrôle des champs obligatoires du formulaire admin (le serveur revalide). */
  static validate(values) {
    if (!String(values.title || '').trim()) return 'Le titre est obligatoire.';
    if (!String(values.issuer || '').trim()) return "L'émetteur est obligatoire.";
    if (!values.issueDate) return "La date d'obtention est obligatoire.";
    if (values.expiryDate && values.expiryDate < values.issueDate)
      return "La date d'expiration doit suivre la date d'obtention.";
    const tooLong = String(values.skills || '')
      .split(',')
      .find((x) => x.trim().length > 60);
    if (tooLong)
      return `Compétence trop longue (60 caractères maximum) : « ${tooLong.trim().slice(0, 30)}… ». Séparez-les par des virgules.`;
    return null;
  }

  /** Valeurs du formulaire (texte) → corps de requête typé. `urls` : fichiers envoyés. */
  static toDto(values, urls = {}) {
    const text = (v) => {
      const t = String(v ?? '').trim();
      return t === '' ? null : t;
    };
    return {
      title: values.title.trim(),
      issuer: values.issuer.trim(),
      category: text(values.category),
      description: text(values.description),
      issueDate: values.issueDate,
      expiryDate: text(values.expiryDate),
      credentialId: text(values.credentialId),
      credentialUrl: withScheme(text(values.credentialUrl)),
      imageUrl: urls.imageUrl ?? text(values.imageUrl),
      documentUrl: urls.documentUrl ?? text(values.documentUrl),
      skills: [
        ...new Set(
          String(values.skills || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        ),
      ],
      featured: Boolean(values.featured),
      sortOrder: parseInt(values.sortOrder, 10) || 0,
    };
  }
}
