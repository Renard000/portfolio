const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const DAY = 24 * 60 * 60 * 1000;

const text = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};

export default class ArticleService {
  constructor(articleRepository) {
    this.articleRepository = articleRepository;
  }

  // ---------- Blog public ----------
  async list({ category = '', q = '', page = 1, limit } = {}) {
    const res = await this.articleRepository.list({
      category: category && category !== 'all' ? category : undefined,
      q: q.trim() || undefined,
      page,
      limit,
    });
    return {
      items: res.items || [],
      total: res.total || 0,
      page: res.page || page,
      pages: res.pages || 1,
      categories: res.categories || [],
    };
  }

  get(slug) {
    return this.articleRepository.getBySlug(slug);
  }

  view(id) {
    return this.articleRepository.view(id);
  }

  async like(id) {
    return (await this.articleRepository.like(id)).likes;
  }

  comment(id, { author, content, website }) {
    return this.articleRepository.comment(id, {
      author: String(author || '').trim(),
      content: String(content || '').trim(),
      website: website || undefined,
    });
  }

  // ---------- Administration ----------
  listAll() {
    return this.articleRepository.listAll();
  }

  getById(id) {
    return this.articleRepository.getById(id);
  }

  /** Création (id absent) ou modification. */
  save(id, dto) {
    return id
      ? this.articleRepository.update(id, dto)
      : this.articleRepository.create(dto);
  }

  remove(id) {
    return this.articleRepository.remove(id);
  }

  publish(id) {
    return this.articleRepository.publish(id);
  }

  unpublish(id) {
    return this.articleRepository.unpublish(id);
  }

  // ---------- Règles et formatage (sans état) ----------

  /** « Mon Article ! » → « mon-article » (même règle que le serveur). */
  static slugify(title) {
    return String(title || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/, '');
  }

  static validate(values) {
    if (!String(values.title || '').trim()) return 'Le titre est obligatoire.';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug || ''))
      return 'Slug invalide : minuscules, chiffres et tirets uniquement.';
    if (!String(values.content || '').trim()) return 'Le contenu est obligatoire.';
    return null;
  }

  static toDto(values, urls = {}) {
    return {
      title: values.title.trim(),
      slug: values.slug,
      excerpt: text(values.excerpt),
      content: values.content,
      coverUrl: urls.coverUrl ?? text(values.coverUrl),
      category: text(values.category),
      tags: [
        ...new Set(
          String(values.tags || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        ),
      ],
    };
  }

  /** « 23 oct. 2026 » */
  static formatDate(iso, withYear = true) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    return `${day} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
  }

  /** « il y a 2 h », « hier », « il y a 5 j » */
  static relative(iso, now = new Date()) {
    const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) return 'à l’instant';
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(diff / DAY);
    if (days === 1) return 'hier';
    if (days < 30) return `il y a ${days} j`;
    return ArticleService.formatDate(iso);
  }

  /** 1248 → « 1,2 k » ; 932 → « 932 » */
  static compact(n) {
    const v = Number(n) || 0;
    if (v < 1000) return String(v);
    return `${(v / 1000).toFixed(1).replace('.', ',').replace(',0', '')} k`;
  }

  /** 1248 → « 1 248 » (espace fine insécable) */
  static thousands(n) {
    return new Intl.NumberFormat('fr-CA').format(Number(n) || 0);
  }

  /** Modèle d'affichage d'une carte d'article (les vues ne formatent rien). */
  static toCard(a, index = 0) {
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt || '',
      category: a.category,
      coverUrl: a.coverUrl || null,
      color: CARD_COLORS[index % CARD_COLORS.length],
      kind: index % 3,
      date: ArticleService.formatDate(a.publishedAt, false),
      fullDate: ArticleService.formatDate(a.publishedAt),
      minutes: a.readingMinutes || 1,
      likes: a.likes || 0,
      views: ArticleService.compact(a.views),
      comments: a.comments || 0,
    };
  }
}

const CARD_COLORS = ['#3b2f8f', '#0f5e4d', '#8a3a24', '#24507a', '#6b3b8f'];
