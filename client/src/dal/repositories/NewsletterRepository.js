export default class NewsletterRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  subscribe(dto) {
    return this.apiClient.post('/newsletter/subscribe', dto);
  }
  subscribePush(token) {
    return this.apiClient.post('/push/subscribe', { token });
  }
}
