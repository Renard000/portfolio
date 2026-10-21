export default class SubscriberAdminRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  list() {
    return this.apiClient.get('/admin/subscribers');
  }
  removeNewsletter(id) {
    return this.apiClient.delete(
      `/admin/subscribers/newsletter/${encodeURIComponent(id)}`
    );
  }
  removePush(id) {
    return this.apiClient.delete(`/admin/subscribers/push/${encodeURIComponent(id)}`);
  }
  sendTestEmail(to) {
    return this.apiClient.post('/admin/newsletter/test-email', { to });
  }
}
