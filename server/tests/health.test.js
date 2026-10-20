import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/web/app.js';

// On n'importe pas config.js : aucun secret n'est nécessaire pour tester.
const app = createApp(
  {},
  { clientOrigin: 'http://127.0.0.1:9000,http://localhost:9000' }
);

describe('API', () => {
  it('GET /api/health répond ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('renvoie 404 JSON sur une route inconnue', async () => {
    const res = await request(app).get('/api/inconnue');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('autorise le CORS pour une origine configurée', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:9000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:9000');
  });

  it('refuse le CORS pour une autre origine', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://pirate.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
