export default class ArticleService {
  constructor(articleRepository) {
    this.articleRepository = articleRepository;
  }

  async list(params = {}) {
    const result = await this.articleRepository.list({ page: 1, ...params });
    return Array.isArray(result) ? result : result.items || [];
  }
}
