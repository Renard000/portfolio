import ApiClient, { ApiError } from './ApiClient.js';

const fakeFetch = (status, body) =>
  vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    text: async () => JSON.stringify(body),
  });

describe('ApiClient : erreurs de validation', () => {
  it('le message indique le champ refusé', async () => {
    const api = new ApiClient(
      'http://x',
      async () => null,
      async () => ({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            error: 'Données invalides',
            details: [{ path: 'credentialUrl', message: 'URL http(s) invalide' }],
          }),
      })
    );
    await expect(api.post('/a', {})).rejects.toThrow(
      'Données invalides — credentialUrl : URL http(s) invalide'
    );
  });
});

describe('ApiClient', () => {
  it('ajoute les paramètres et le jeton', async () => {
    const fetchImpl = fakeFetch(200, [{ id: 1 }]);
    const client = new ApiClient('http://api/', async () => 'tok', fetchImpl);
    const data = await client.get('/articles', { page: 2, q: '' });
    expect(data).toEqual([{ id: 1 }]);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://api/articles?page=2');
    expect(options.headers.Authorization).toBe('Bearer tok');
  });

  it("lève une ApiError sur une réponse d'erreur", async () => {
    const client = new ApiClient(
      'http://api',
      async () => null,
      fakeFetch(404, { error: 'Not found' })
    );
    await expect(client.get('/x')).rejects.toBeInstanceOf(ApiError);
  });
});
