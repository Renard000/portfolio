import { NotFoundError } from '../../domain/errors/index.js';

export default class ArticleService {
  constructor(articleRepository, notificationService = null) {
    this.articleRepository = articleRepository;
    this.notificationService = notificationService;
  }

  /** Publie un brouillon puis notifie abonnés (courriel) et appareils (push). */
  async publish(id) {
    const article = await this.articleRepository.findById(id);
    if (!article) throw new NotFoundError('Article introuvable');
    article.publish();
    const saved = await this.articleRepository.save(article);
    if (this.notificationService) {
      try {
        await this.notificationService.notifyPublished(saved);
      } catch {
        // L'article est publié : une panne de notification ne doit pas l'annuler.
      }
    }
    return saved;
  }
}
