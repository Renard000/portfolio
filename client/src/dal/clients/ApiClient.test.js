import ApiClient, { ApiError } from './ApiClient.js';

const fakeFetch = (status, body) =>
  vi
    .fn()
    .mockResolvedValue({
      ok: status < 400,
      status,
      text: async () => JSON.stringify(body),
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
