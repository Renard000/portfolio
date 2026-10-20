export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Client HTTP vers l'API Node. Reçoit ses dépendances par le constructeur
 * (URL de base, fonction qui renvoie le jeton, fetch) : aucun état global.
 */
export default class ApiClient {
  constructor(
    baseUrl,
    getToken = async () => null,
    fetchImpl = (...args) => fetch(...args)
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.getToken = getToken;
    this.fetchImpl = fetchImpl;
  }

  async request(method, path, { params, body } = {}) {
    let url = this.baseUrl + path;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '')
          query.append(key, value);
      });
      const qs = query.toString();
      if (qs) url += '?' + qs;
    }

    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = await this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new ApiError(
        (data && data.error) || 'Erreur ' + response.status,
        response.status,
        data
      );
    }
    return data;
  }

  get(path, params) {
    return this.request('GET', path, { params });
  }
  post(path, body) {
    return this.request('POST', path, { body });
  }
  put(path, body) {
    return this.request('PUT', path, { body });
  }
  delete(path) {
    return this.request('DELETE', path);
  }
}
