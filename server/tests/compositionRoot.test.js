import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildContainer } from '../src/web/compositionRoot.js';
import { createApp } from '../src/web/app.js';

// Assemblage réel (sans réseau : Supabase et Firebase ne sont pas appelés ici).
const config = {
  clientOrigin: 'http://localhost:9000',
  siteUrl: 'http://localhost:9000',
  supabaseUrl: 'http://localhost:54321',
  serviceRoleKey: 'service-role-test',
  firebase: { projectId: 'p', clientEmail: 'e@p.iam', privateKey: 'k' },
  email: { apiKey: '', from: 'x', publicApiUrl: 'http://localhost:4000' },
  contact: { notifyTo: '' },
  aws: { region: 'ca-central-1', accessKeyId: '', secretAccessKey: '', bucket: '' },
  cloudfront: { url: '', keyPairId: '', privateKey: '' },
  maxVideoBytes: 1000,
};

describe('composition root serveur', () => {
  const container = buildContainer(config);
  const app = createApp(container, config);

  it("construit tous les contrôleurs et services de l'addendum", () => {
    for (const k of [
      'certificationController',
      'awardController',
      'newsletterController',
      'subscriberAdminController',
      'contactController',
      'videoController',
      'videoAdminController',
      'authService',
      'articleService',
    ])
      expect(container[k], k).toBeDefined();
  });
  it('monte les routes : /api/health reste ok, routes admin protégées (401)', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/admin/subscribers')).status).toBe(401);
    expect((await request(app).post('/api/certifications').send({})).status).toBe(401);
  });
  it('validation exécutée avant tout accès réseau', async () => {
    expect((await request(app).post('/api/newsletter/subscribe').send({})).status).toBe(
      400
    );
  });

  it("avec AWS et CloudFront configurés, l'assemblage réussit aussi (client S3 créé sans réseau)", () => {
    const full = {
      ...config,
      aws: {
        region: 'ca-central-1',
        accessKeyId: 'AK',
        secretAccessKey: 'SK',
        bucket: 'b',
      },
      cloudfront: { url: 'https://d1.cloudfront.net', keyPairId: 'K', privateKey: 'PEM' },
    };
    const c = buildContainer(full);
    expect(c.videoController).toBeDefined();
    expect(createApp(c, full)).toBeDefined();
  });
  it('routes vidéo montées : administration protégée (401)', async () => {
    expect((await request(app).get('/api/admin/video-series')).status).toBe(401);
    expect((await request(app).post('/api/videos').send({})).status).toBe(401);
    expect((await request(app).get('/api/video-series?limit=99')).status).toBe(400);
  });
});
