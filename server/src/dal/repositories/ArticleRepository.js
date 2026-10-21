import Article from '../../domain/entities/Article.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'articles';

const fromRow = (r) =>
  new Article({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    status: r.status,
    publishedAt: r.published_at,
  });

export default class ArticleRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

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
}
