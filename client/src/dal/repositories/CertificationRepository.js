export default class CertificationRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  list(params) {
    return this.apiClient.get('/certifications', params);
  }
  create(dto) {
    return this.apiClient.post('/certifications', dto);
  }
  update(id, dto) {
    return this.apiClient.put(`/certifications/${encodeURIComponent(id)}`, dto);
  }
  remove(id) {
    return this.apiClient.delete(`/certifications/${encodeURIComponent(id)}`);
  }
}
