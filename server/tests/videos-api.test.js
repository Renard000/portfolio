import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/web/app.js';
import VideoService from '../src/bll/services/VideoService.js';
import VideoUploadService from '../src/bll/services/VideoUploadService.js';
import PlaybackService from '../src/bll/services/PlaybackService.js';
import AuthService from '../src/bll/services/AuthService.js';
import VideoController from '../src/web/controllers/VideoController.js';
import VideoAdminController from '../src/web/controllers/VideoAdminController.js';
import { UnconfiguredStorage } from '../src/dal/clients/CdnSigner.js';
import { ServiceUnavailableError } from '../src/domain/errors/index.js';
import { MemoryVideoStore, FakeStorage } from './helpers/fakes.js';

const ADMIN = { Authorization: 'Bearer admin-jwt' };
const USER = { Authorization: 'Bearer user-jwt' };
const CDN = 'https://d1.cloudfront.net';
let store, storage, signer, series, app;

function build({ signerOverride } = {}) {
  const sig = signerOverride || signer;
  const notifier = { notify: vi.fn().mockResolvedValue({}) };
  const videoService = new VideoService(
    store.seriesRepo,
    store.videoRepo,
    storage,
    notifier,
    { cdnUrl: CDN, logger: { error() {}, log() {} } }
  );
  const upload = new VideoUploadService(store.seriesRepo, store.videoRepo, storage, {
    maxVideoBytes: 1000 * 1024 * 1024,
  });
  const playback = new PlaybackService(store.videoRepo, store.seriesRepo, sig);
  const authService = new AuthService({
    getUserFromToken: async (t) =>
      ({ 'admin-jwt': { id: 'a' }, 'user-jwt': { id: 'u' } })[t] || null,
    getRole: async (id) => (id === 'a' ? 'admin' : 'user'),
  });
  return createApp(
    {
      authService,
      certificationController: {},
      awardController: {},
      newsletterController: {},
      subscriberAdminController: {},
      contactController: {},
      videoController: new VideoController(videoService, playback),
      videoAdminController: new VideoAdminController(videoService, upload),
    },
    { clientOrigin: 'http://localhost:9000' }
  );
}

beforeEach(() => {
  store = new MemoryVideoStore();
  storage = new FakeStorage();
  signer = { sign: vi.fn((key) => `${CDN}/${key}?Expires=1&Signature=s&Key-Pair-Id=K`) };
  series = store.addSeries();
  app = build();
});

describe('API publique des formations', () => {
  it('GET /video-series : liste paginée sans clé S3', async () => {
    store.addVideo(series);
    const res = await request(app).get('/api/video-series');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ slug: 'react-avance', videoCount: 1 });
    expect(res.text).not.toMatch(/videoKey|videos\/react-avance/);
  });
  it('filtres et limite (> 20 refusé)', async () => {
    store.addVideo(series);
    expect(
      (await request(app).get('/api/video-series?level=beginner')).body.items
    ).toHaveLength(0);
    expect(
      (await request(app).get('/api/video-series?level=intermediate')).body.items
    ).toHaveLength(1);
    expect((await request(app).get('/api/video-series?limit=21')).status).toBe(400);
    expect((await request(app).get('/api/video-series?level=expert')).status).toBe(400);
    expect((await request(app).get('/api/video-series?limit=20&page=1')).status).toBe(
      200
    );
  });
  it('GET /video-series/:slug et /:seriesSlug/videos/:videoSlug', async () => {
    store.addVideo(series, { slug: 'a' });
    store.addVideo(series, { slug: 'b' });
    const s = await request(app).get('/api/video-series/react-avance');
    expect(s.body.videos.map((v) => v.slug)).toEqual(['a', 'b']);
    const v = await request(app).get('/api/video-series/react-avance/videos/a');
    expect(v.body.next.slug).toBe('b');
    expect(v.body.previous).toBeNull();
    expect(v.text).not.toContain('videoKey');
    expect((await request(app).get('/api/video-series/inconnue')).status).toBe(404);
    expect(
      (await request(app).get('/api/video-series/react-avance/videos/zzz')).status
    ).toBe(404);
    expect((await request(app).get('/api/video-series/Pas Un Slug')).status).toBe(400);
  });
  it('POST /videos/:id/view : 204 ; id mal formé 400', async () => {
    const v = store.addVideo(series);
    expect((await request(app).post(`/api/videos/${v.id}/view`)).status).toBe(204);
    expect(store.videos[0].views).toBe(1);
    expect((await request(app).post('/api/videos/pas-un-uuid/view')).status).toBe(400);
  });
});

describe('POST /videos/:id/playback (URL signée)', () => {
  const uuid = () => store.addVideo(series).id;
  it('renvoie une URL signée + expiration, jamais mise en cache', async () => {
    const id = uuid();
    const res = await request(app).post(`/api/videos/${id}/playback`);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.url).toContain('Signature=');
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(signer.sign).toHaveBeenCalledTimes(1);
  });
  it('brouillon ou série masquée : 404 sans signer', async () => {
    const d = store.addVideo(series, { slug: 'd', status: 'draft' });
    expect((await request(app).post(`/api/videos/${d.id}/playback`)).status).toBe(404);
    expect(signer.sign).not.toHaveBeenCalled();
  });
  it('limitation stricte : 30 demandes par heure, la 31e est refusée', async () => {
    const id = uuid();
    let last;
    for (let i = 0; i < 31; i++)
      last = await request(app).post(`/api/videos/${id}/playback`);
    expect(last.status).toBe(429);
    expect(signer.sign).toHaveBeenCalledTimes(30);
  });
  it('AWS non configuré : 503 avec message clair, sans fuite', async () => {
    const id = uuid();
    const off = new UnconfiguredStorage(() => {
      throw new ServiceUnavailableError('Service vidéo non configuré');
    });
    const res = await request(build({ signerOverride: off })).post(
      `/api/videos/${id}/playback`
    );
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'Service vidéo non configuré' });
  });
});

describe('Administration des formations', () => {
  const ser = { title: 'Nouvelle', slug: 'nouvelle' };
  it('401 sans jeton, 403 pour un simple utilisateur, sur toutes les routes admin', async () => {
    const routes = [
      ['get', '/api/admin/video-series'],
      ['post', '/api/video-series'],
      ['post', '/api/videos'],
      ['post', '/api/admin/videos/upload-url'],
      ['put', `/api/video-series/${series.id}/order`],
    ];
    for (const [m, url] of routes) {
      expect((await request(app)[m](url).send({})).status, `${m} ${url}`).toBe(401);
      expect((await request(app)[m](url).set(USER).send({})).status, `${m} ${url}`).toBe(
        403
      );
    }
  });
  it('CRUD série : création (201), modification, doublon de slug (400), suppression (204)', async () => {
    const c = await request(app).post('/api/video-series').set(ADMIN).send(ser);
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ status: 'draft', level: 'beginner' });
    expect(
      (await request(app).post('/api/video-series').set(ADMIN).send(ser)).status
    ).toBe(400);
    const u = await request(app)
      .put(`/api/video-series/${c.body.id}`)
      .set(ADMIN)
      .send({ status: 'published' });
    expect(u.body.status).toBe('published');
    expect(
      (await request(app).delete(`/api/video-series/${c.body.id}`).set(ADMIN)).status
    ).toBe(204);
    expect(
      (await request(app).delete(`/api/video-series/${c.body.id}`).set(ADMIN)).status
    ).toBe(404);
  });
  it('validation des séries : slug, niveau, champ vide', async () => {
    const post = (b) => request(app).post('/api/video-series').set(ADMIN).send(b);
    expect((await post({ title: 'X', slug: 'Pas Valide' })).status).toBe(400);
    expect((await post({ title: 'X', slug: 'ok', level: 'expert' })).status).toBe(400);
    expect((await post({ title: '', slug: 'ok' })).status).toBe(400);
    expect(
      (await request(app).put(`/api/video-series/${series.id}`).set(ADMIN).send({}))
        .status
    ).toBe(400);
  });
  it('liste admin (brouillons inclus) et détail complet avec clés S3 — admin seulement', async () => {
    store.addSeries({ slug: 'brouillon', status: 'draft' });
    store.addVideo(series);
    const list = await request(app).get('/api/admin/video-series').set(ADMIN);
    expect(list.body).toHaveLength(2);
    const detail = await request(app)
      .get(`/api/admin/video-series/${series.id}`)
      .set(ADMIN);
    expect(detail.body.videos[0].videoKey).toMatch(/^videos\/react-avance\//);
  });
  const videoBody = (o = {}) => ({
    seriesId: series.id,
    title: 'Intro',
    slug: 'intro',
    videoKey: 'videos/react-avance/01-intro.mp4',
    durationSeconds: 600,
    ...o,
  });
  it('création de vidéo : vérifie le fichier S3 (201) ou refuse (400)', async () => {
    expect(
      (await request(app).post('/api/videos').set(ADMIN).send(videoBody())).status
    ).toBe(400);
    storage.files.set('videos/react-avance/01-intro.mp4', 42);
    const ok = await request(app)
      .post('/api/videos')
      .set(ADMIN)
      .send(
        videoBody({
          chapters: [
            { t: 0, label: 'Intro' },
            { t: 60, label: 'Suite' },
          ],
          resources: [{ label: 'Dépôt', url: 'https://github.com/x/y' }],
        })
      );
    expect(ok.status).toBe(201);
    expect(ok.body.sizeBytes).toBe(42);
  });
  it.each([
    ['clé avec ..', { videoKey: 'videos/../secret.mp4' }],
    ['clé avec //', { videoKey: 'videos//x.mp4' }],
    [
      "URL complète à la place d'une clé",
      { videoKey: 'https://cdn.example/videos/a.mp4' },
    ],
    ['majuscules', { videoKey: 'videos/React/01.mp4' }],
    ['autre dossier', { videoKey: 'autre/01.mp4' }],
    ['affiche hors posters/', { posterKey: 'videos/x.jpg' }],
    ['durée nulle', { durationSeconds: 0 }],
    ['chapitre sans libellé', { chapters: [{ t: 1, label: '' }] }],
    [
      'ressource javascript:',
      { resources: [{ label: 'x', url: 'javascript:alert(1)' }] },
    ],
    ['slug invalide', { slug: 'Slug Invalide' }],
  ])('refuse (400) : %s', async (_n, patch) => {
    storage.files.set('videos/react-avance/01-intro.mp4', 42);
    expect(
      (await request(app).post('/api/videos').set(ADMIN).send(videoBody(patch))).status
    ).toBe(400);
    expect(store.videos).toHaveLength(0);
  });
  it('chapitres non croissants refusés par le serveur (400)', async () => {
    storage.files.set('videos/react-avance/01-intro.mp4', 42);
    const r = await request(app)
      .post('/api/videos')
      .set(ADMIN)
      .send(
        videoBody({
          chapters: [
            { t: 30, label: 'a' },
            { t: 10, label: 'b' },
          ],
        })
      );
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/croissants/);
  });
  it('PUT/DELETE vidéo et réordonnancement', async () => {
    const a = store.addVideo(series, { slug: 'a' });
    const b = store.addVideo(series, { slug: 'b' });
    expect(
      (
        await request(app)
          .put(`/api/videos/${a.id}`)
          .set(ADMIN)
          .send({ title: 'Renommée' })
      ).body.title
    ).toBe('Renommée');
    const ord = await request(app)
      .put(`/api/video-series/${series.id}/order`)
      .set(ADMIN)
      .send({ videoIds: [b.id, a.id] });
    expect(ord.body.videos.map((v) => v.slug)).toEqual(['b', 'a']);
    expect(
      (
        await request(app)
          .put(`/api/video-series/${series.id}/order`)
          .set(ADMIN)
          .send({ videoIds: [a.id] })
      ).status
    ).toBe(400);
    expect((await request(app).delete(`/api/videos/${a.id}`).set(ADMIN)).status).toBe(
      204
    );
    expect((await request(app).delete(`/api/videos/${a.id}`).set(ADMIN)).status).toBe(
      404
    );
  });
  it('upload-url : clé générée par le serveur (un chemin envoyé par le client est ignoré)', async () => {
    const res = await request(app).post('/api/admin/videos/upload-url').set(ADMIN).send({
      seriesId: series.id,
      videoSlug: 'intro',
      contentType: 'video/mp4',
      size: 5000,
      key: 'videos/../../evil.mp4',
      path: '/etc/passwd',
    });
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.key).toBe('videos/react-avance/01-intro.mp4');
    expect(storage.uploads[0].key).toBe('videos/react-avance/01-intro.mp4');
    expect(res.body.expiresIn).toBe(900);
  });
  it('upload-url : refuse mauvais type, fichier trop gros, slug invalide, série inconnue', async () => {
    const post = (b) =>
      request(app)
        .post('/api/admin/videos/upload-url')
        .set(ADMIN)
        .send({
          seriesId: series.id,
          videoSlug: 'intro',
          contentType: 'video/mp4',
          size: 5000,
          ...b,
        });
    expect((await post({ contentType: 'video/avi' })).status).toBe(400);
    expect((await post({ size: 2000 * 1024 * 1024 })).status).toBe(400);
    expect((await post({ videoSlug: '../x' })).status).toBe(400);
    expect(
      (await post({ seriesId: '99999999-9999-4999-8999-999999999999' })).status
    ).toBe(404);
    expect((await post({ size: 0 })).status).toBe(400);
  });
});
