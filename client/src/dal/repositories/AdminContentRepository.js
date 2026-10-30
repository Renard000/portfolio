const enc = encodeURIComponent;

/** Tableau de bord, modération des commentaires et messages de contact (admin). */
export default class AdminContentRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  dashboard() {
    return this.apiClient.get('/admin/dashboard');
  }

  listComments() {
    return this.apiClient.get('/admin/comments');
  }
  moderateComment(id, approved) {
    return this.apiClient.put(`/admin/comments/${enc(id)}`, { approved });
  }
  removeComment(id) {
    return this.apiClient.delete(`/admin/comments/${enc(id)}`);
  }

  listMessages() {
    return this.apiClient.get('/admin/messages');
  }
  markMessage(id, lu) {
    return this.apiClient.put(`/admin/messages/${enc(id)}`, { lu });
  }
  removeMessage(id) {
    return this.apiClient.delete(`/admin/messages/${enc(id)}`);
  }
}
