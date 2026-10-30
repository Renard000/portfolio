import { NotFoundError } from '../../domain/errors/index.js';

export default class CommentService {
  constructor(commentRepository, articleRepository) {
    this.commentRepository = commentRepository;
    this.articleRepository = articleRepository;
  }

  /**
   * Commentaire public : enregistré NON approuvé (publié après modération).
   * Refusé (404) si l'article n'existe pas ou n'est pas publié.
   */
  async submit(articleId, { author, content, website }) {
    // Honeypot rempli : même réponse, rien n'est écrit.
    if (website) return { status: 'pending' };
    const article = await this.articleRepository.findById(articleId);
    if (!article || !article.isPublished())
      throw new NotFoundError('Article introuvable');
    await this.commentRepository.create({ articleId, author, content });
    return { status: 'pending' };
  }

  listAll() {
    return this.commentRepository.listAll();
  }

  async setApproved(id, approved) {
    const comment = await this.commentRepository.setApproved(id, approved);
    if (!comment) throw new NotFoundError('Commentaire introuvable');
    return comment;
  }

  async remove(id) {
    if (!(await this.commentRepository.delete(id)))
      throw new NotFoundError('Commentaire introuvable');
  }
}
