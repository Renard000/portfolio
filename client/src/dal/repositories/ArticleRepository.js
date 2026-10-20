export default class ArticleRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  list(params) {
    return this.apiClient.get('/articles', params);
  }
}
