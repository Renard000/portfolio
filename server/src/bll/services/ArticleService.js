import { NotFoundError, ValidationError } from '../../domain/errors/index.js';
import Publication from '../../domain/entities/Publication.js';

const isDuplicate = (err) => /duplicate key|unique/i.test(err.message || '');
const RELATED = 3;

export default class ArticleService {
  constructor(articleRepository, publications = null, commentRepository = null) {
    this.articleRepository = articleRepository;
    this.publications = publications;
    this.commentRepository = commentRepository;
  }

  // ---------- Blog public ----------

  /** Liste paginée (20 au maximum par page, E.7), sans le texte complet. */
  async listPublished({ category, q, page = 1, limit = 9 } = {}) {
    const offset = (page - 1) * limit;
    const [{ items, total }, categories] = await Promise.all([
      this.articleRepository.listPublished({ category, q, offset, limit }),
      this.articleRepository.publishedCategories(),
    ]);
    return {
      items: await this.#withCommentCounts(items),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories,
    };
  }

  /** Article publié, ses commentaires approuvés et 3 articles « à lire ensuite ». */
  async getPublished(slug) {
    const article = await this.articleRepository.findPublishedBySlug(slug);
    if (!article) throw new NotFoundError('Article introuvable');
    const [comments, recent] = await Promise.all([
      this.commentRepository ? this.commentRepository.listApproved(article.id) : [],
      this.articleRepository.listPublished({ offset: 0, limit: 12 }),
    ]);
    const others = recent.items.filter((a) => a.id !== article.id);
    // Même catégorie d'abord, puis les plus récents
    const related = [
      ...others.filter((a) => a.category && a.category === article.category),
      ...others.filter((a) => !a.category || a.category !== article.category),
    ].slice(0, RELATED);
    return {
      article: article.toJSON(),
      comments: comments.map((c) => c.toPublic()),
      related: await this.#withCommentCounts(related),
    };
  }

  /** Les fonctions SQL ignorent les articles non publiés. */
  async view(id) {
    await this.articleRepository.incrementViews(id);
  }

  async like(id) {
    const likes = await this.articleRepository.incrementLikes(id);
    if (likes === null) throw new NotFoundError('Article introuvable');
    return { likes };
  }

  async #withCommentCounts(articles) {
    const counts = this.commentRepository
      ? await this.commentRepository.countApprovedByArticle(articles.map((a) => a.id))
      : {};
    return articles.map((a) => ({ ...a.toSummary(), comments: counts[a.id] || 0 }));
  }

  // ---------- Administration ----------

  async listAll() {
    return (await this.articleRepository.listAll()).map((a) => a.toSummary());
  }

  async getById(id) {
    const article = await this.articleRepository.findById(id);
    if (!article) throw new NotFoundError('Article introuvable');
    return article;
  }

  /** Un nouvel article est toujours un brouillon : la publication passe par publish(). */
  async create(dto) {
    try {
      return await this.articleRepository.create({ ...dto, status: 'draft' });
    } catch (err) {
      if (isDuplicate(err)) throw new ValidationError('Ce slug est déjà utilisé');
      throw err;
    }
  }

  async update(id, dto) {
    try {
      const updated = await this.articleRepository.update(id, dto);
      if (!updated) throw new NotFoundError('Article introuvable');
      return updated;
    } catch (err) {
      if (isDuplicate(err)) throw new ValidationError('Ce slug est déjà utilisé');
      throw err;
    }
  }

  async remove(id) {
    if (!(await this.articleRepository.delete(id)))
      throw new NotFoundError('Article introuvable');
    await this.#retract(id);
  }

  async #retract(id) {
    if (this.publications) await this.publications.retract({ kind: 'article', id });
  }

  /** Publie un brouillon puis notifie abonnés (courriel) et appareils (push). */
  async publish(id) {
    const article = await this.articleRepository.findById(id);
    if (!article) throw new NotFoundError('Article introuvable');
    article.publish();
    const saved = await this.articleRepository.save(article);
    if (this.publications) await this.publications.notify(Publication.fromArticle(saved));
    return saved;
  }

  /** Retire un article du blog (aucune notification). */
  async unpublish(id) {
    const article = await this.articleRepository.findById(id);
    if (!article) throw new NotFoundError('Article introuvable');
    article.unpublish();
    const saved = await this.articleRepository.save(article);
    await this.#retract(id);
    return saved;
  }
}
