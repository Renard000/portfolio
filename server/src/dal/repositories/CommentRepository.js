import Comment from '../../domain/entities/Comment.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'comments';
const WITH_ARTICLE = '*, article:articles(title, slug)';

const fromRow = (r) =>
  new Comment({
    id: r.id,
    articleId: r.article_id,
    author: r.author,
    content: r.content,
    approved: r.approved,
    createdAt: r.created_at,
    article: r.article || null,
  });

export default class CommentRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async listApproved(articleId) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .eq('article_id', articleId)
        .eq('approved', true)
        .order('created_at', { ascending: false })
    );
    return data.map(fromRow);
  }

  /** { articleId: nombre de commentaires approuvés } pour les cartes du blog. */
  async countApprovedByArticle(articleIds) {
    if (!articleIds.length) return {};
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('article_id')
        .eq('approved', true)
        .in('article_id', articleIds)
    );
    return data.reduce((acc, r) => {
      acc[r.article_id] = (acc[r.article_id] || 0) + 1;
      return acc;
    }, {});
  }

  async create({ articleId, author, content }) {
    return fromRow(
      unwrap(
        await this.supabase
          .from(TABLE)
          .insert({ article_id: articleId, author, content })
          .select()
          .single()
      )
    );
  }

  /** Admin : tous les commentaires, avec le titre de l'article. */
  async listAll() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select(WITH_ARTICLE)
        .order('created_at', { ascending: false })
    );
    return data.map(fromRow);
  }

  async setApproved(id, approved) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update({ approved })
        .eq('id', id)
        .select(WITH_ARTICLE)
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
