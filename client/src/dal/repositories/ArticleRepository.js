const enc = encodeURIComponent;

/** Blog public et administration des articles (tout passe par l'API Node). */
export default class ArticleRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // --- Public ---
  list(params) {
    return this.apiClient.get('/articles', params);
  }
  getBySlug(slug) {
    return this.apiClient.get(`/articles/${enc(slug)}`);
  }
  view(id) {
    return this.apiClient.post(`/articles/${enc(id)}/view`);
  }
  like(id) {
    return this.apiClient.post(`/articles/${enc(id)}/like`);
  }
  comment(id, dto) {
    return this.apiClient.post(`/articles/${enc(id)}/comments`, dto);
  }

  // --- Admin ---
  listAll() {
    return this.apiClient.get('/admin/articles');
  }
  getById(id) {
    return this.apiClient.get(`/admin/articles/${enc(id)}`);
  }
  create(dto) {
    return this.apiClient.post('/admin/articles', dto);
  }
  update(id, dto) {
    return this.apiClient.put(`/admin/articles/${enc(id)}`, dto);
  }
  remove(id) {
    return this.apiClient.delete(`/admin/articles/${enc(id)}`);
  }
  publish(id) {
    return this.apiClient.post(`/admin/articles/${enc(id)}/publish`);
  }
  unpublish(id) {
    return this.apiClient.post(`/admin/articles/${enc(id)}/unpublish`);
  }
}
