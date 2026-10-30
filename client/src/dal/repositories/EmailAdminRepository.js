const enc = encodeURIComponent;

/** Modèles de courriel, réponses aux messages et news (admin) ; fil public des publications. */
export default class EmailAdminRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  listPublications() {
    return this.apiClient.get('/publications');
  }

  listTemplates() {
    return this.apiClient.get('/admin/email-templates');
  }
  saveTemplate(key, dto) {
    return this.apiClient.put(`/admin/email-templates/${enc(key)}`, dto);
  }
  resetTemplate(key) {
    return this.apiClient.delete(`/admin/email-templates/${enc(key)}`);
  }
  previewTemplate(key, dto) {
    return this.apiClient.post(`/admin/email-templates/${enc(key)}/preview`, dto);
  }
  testTemplate(key, dto) {
    return this.apiClient.post(`/admin/email-templates/${enc(key)}/test`, dto);
  }

  replyDraft(id) {
    return this.apiClient.get(`/admin/messages/${enc(id)}/reply`);
  }
  reply(id, dto) {
    return this.apiClient.post(`/admin/messages/${enc(id)}/reply`, dto);
  }

  broadcast(dto) {
    return this.apiClient.post('/admin/newsletter/broadcast', dto);
  }
}
