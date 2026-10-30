import Article from '../../domain/entities/Article.js';
import { unwrap } from '../unwrap.js';
import { toColumns, searchTerm } from '../columns.js';

const TABLE = 'articles';
// Le texte est lu pour estimer la durée de lecture, mais les listes renvoyées
// par l'API n'exposent jamais le texte complet (E.7 : Article.toSummary()).
const SUMMARY_COLUMNS =
  'id, title, slug, excerpt, content, cover_url, category, tags, status, views, likes, published_at, created_at';

const COLUMNS = {
  title: 'title',
  slug: 'slug',
  excerpt: 'excerpt',
  content: 'content',
  coverUrl: 'cover_url',
  category: 'category',
  tags: 'tags',
  status: 'status',
  publishedAt: 'published_at',
};

const fromRow = (r) =>
  new Article({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    coverUrl: r.cover_url,
    category: r.category,
    tags: r.tags,
    status: r.status,
    views: r.views,
    likes: r.likes,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  });

export default class ArticleRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /** Articles publiés, du plus récent au plus ancien, avec le total pour la pagination. */
  async listPublished({ category, q, offset = 0, limit = 9 } = {}) {
    let query = this.supabase
      .from(TABLE)
      .select(SUMMARY_COLUMNS, { count: 'exact' })
      .eq('status', 'published');
    if (category) query = query.eq('category', category);
    const term = searchTerm(q);
    if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    unwrap({ data, error });
    return { items: data.map(fromRow), total: count ?? data.length };
  }

  /** Catégories des articles publiés (filtres du blog). */
  async publishedCategories() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('category')
        .eq('status', 'published')
        .not('category', 'is', null)
    );
    return [...new Set(data.map((r) => r.category))];
  }

  async findPublishedBySlug(slug) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  /** Admin : tous les articles, brouillons compris. */
  async listAll() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select(SUMMARY_COLUMNS)
        .order('created_at', { ascending: false })
    );
    return data.map(fromRow);
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async create(dto) {
    return fromRow(
      unwrap(
        await this.supabase.from(TABLE).insert(toColumns(dto, COLUMNS)).select().single()
      )
    );
  }

  async update(id, dto) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update(toColumns(dto, COLUMNS))
        .eq('id', id)
        .select()
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  /** Enregistre le statut de publication d'une entité Article. */
  async save(article) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update({ status: article.status, published_at: article.publishedAt })
        .eq('id', article.id)
        .select()
        .single()
    );
    return fromRow(data);
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }

  async incrementViews(id) {
    unwrap(await this.supabase.rpc('increment_views', { p_article_id: id }));
  }

  /** Renvoie le nouveau total, ou null si l'article n'est pas publié. */
  async incrementLikes(id) {
    const data = unwrap(await this.supabase.rpc('increment_likes', { p_article_id: id }));
    return typeof data === 'number' ? data : null;
  }
}
