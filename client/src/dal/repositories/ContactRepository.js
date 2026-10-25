export default class ContactRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  send(dto) {
    return this.apiClient.post('/contact', dto);
  }
}
