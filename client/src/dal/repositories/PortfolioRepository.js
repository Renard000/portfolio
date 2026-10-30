const enc = encodeURIComponent;

/**
 * Ressource CRUD simple de l'API (projets, compétences) :
 * lecture publique, écriture réservée à l'admin.
 */
export default class PortfolioRepository {
  constructor(apiClient, path) {
    this.apiClient = apiClient;
    this.path = path;
  }

  list() {
    return this.apiClient.get(this.path);
  }
  create(dto) {
    return this.apiClient.post(this.path, dto);
  }
  update(id, dto) {
    return this.apiClient.put(`${this.path}/${enc(id)}`, dto);
  }
  remove(id) {
    return this.apiClient.delete(`${this.path}/${enc(id)}`);
  }
}
