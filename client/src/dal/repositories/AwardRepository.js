export default class AwardRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  list() {
    return this.apiClient.get('/awards');
  }
  create(dto) {
    return this.apiClient.post('/awards', dto);
  }
  update(id, dto) {
    return this.apiClient.put(`/awards/${encodeURIComponent(id)}`, dto);
  }
  remove(id) {
    return this.apiClient.delete(`/awards/${encodeURIComponent(id)}`);
  }
}
