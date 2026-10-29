import { describe, it, expect, vi, beforeEach } from 'vitest';
import VideoService, { validateChapters } from '../../src/bll/services/VideoService.js';
import VideoUploadService from '../../src/bll/services/VideoUploadService.js';
import PlaybackService from '../../src/bll/services/PlaybackService.js';
import NotificationService from '../../src/bll/services/NotificationService.js';
import Video from '../../src/domain/entities/Video.js';
import { NotFoundError, ValidationError } from '../../src/domain/errors/index.js';
import {
  MemoryVideoStore,
  FakeStorage,
  MemoryNewsletterRepo,
  MemoryPushRepo,
} from '../helpers/fakes.js';

const CDN = 'https://d123.cloudfront.net';
let store, storage, notifier, svc, logger;
beforeEach(() => {
  store = new MemoryVideoStore();
  storage = new FakeStorage();
  notifier = { notifyVideoPublished: vi.fn().mockResolvedValue({}) };
  logger = { error: vi.fn(), log: vi.fn() };
  svc = new VideoService(store.seriesRepo, store.videoRepo, storage, notifier, {
    cdnUrl: CDN,
    logger,
    clock: () => new Date('2026-05-01T10:00:00Z'),
  });
});

describe('Video (entité)', () => {
  const v = (d) =>
    new Video({
      id: '1',
      seriesId: 's',
      title: 't',
      slug: 't',
      videoKey: 'videos/s/01-t.mp4',
      posterKey: 'posters/s/01-t.jpg',
      durationSeconds: d,
    });
  it('formattedDuration : mm:ss et h:mm:ss', () => {
    expect(v(1590).formattedDuration()).toBe('26:30');
    expect(v(65).formattedDuration()).toBe('1:05');
    expect(v(3725).formattedDuration()).toBe('1:02:05');
    expect(v(5).formattedDuration()).toBe('0:05');
  });
  it('construit les URL à partir des clés (jamais stockées), sans double barre', () => {
    expect(v(1).posterUrl(`${CDN}/`)).toBe(`${CDN}/posters/s/01-t.jpg`);
    expect(v(1).streamUrl(CDN)).toBe(`${CDN}/videos/s/01-t.mp4`);
    expect(new Video({ ...v(1), id: '2', posterKey: null }).posterUrl(CDN)).toBeNull();
  });
  it("toPublic n'expose AUCUNE clé S3", () => {
    const json = JSON.stringify(v(100).toPublic(CDN));
    expect(json).not.toContain('videoKey');
    expect(json).not.toContain('videos/s/01-t.mp4');
    expect(json).not.toContain('posterKey');
    expect(json).toContain(`${CDN}/posters/s/01-t.jpg`);
  });
});

describe('VideoService — lecture publique', () => {
  it('ne liste que les séries publiées ayant une vidéo publiée, avec nombre et durée totale', async () => {
    const a = store.addSeries({ slug: 'a' });
    store.addVideo(a, { durationSeconds: 600 });
    store.addVideo(a, { durationSeconds: 900 });
    store.addVideo(a, { durationSeconds: 5000, status: 'draft' });
    store.addSeries({ slug: 'vide' });
    const draft = store.addSeries({ slug: 'brouillon', status: 'draft' });
    store.addVideo(draft);
    const { items, total } = await svc.listSeries();
    expect(items.map((s) => s.slug)).toEqual(['a']);
    expect(total).toBe(1);
    expect(items[0]).toMatchObject({ videoCount: 2, totalDurationSeconds: 1500 });
  });
  it('filtres catégorie, niveau, tag (insensibles à la casse/accents) et recherche', async () => {
    const mk = (o) => store.addVideo(store.addSeries(o));
    mk({
      slug: 'a',
      category: 'React',
      level: 'beginner',
      tags: ['Hooks'],
      title: 'Intro',
    });
    mk({
      slug: 'b',
      category: 'Node',
      level: 'advanced',
      tags: ['API'],
      title: 'Sécurité',
    });
    expect(
      (await svc.listSeries({ category: 'react' })).items.map((s) => s.slug)
    ).toEqual(['a']);
    expect(
      (await svc.listSeries({ level: 'advanced' })).items.map((s) => s.slug)
    ).toEqual(['b']);
    expect((await svc.listSeries({ tag: 'hooks' })).items.map((s) => s.slug)).toEqual([
      'a',
    ]);
    expect((await svc.listSeries({ q: 'securite' })).items.map((s) => s.slug)).toEqual([
      'b',
    ]);
  });
  it('pagine avec 20 éléments maximum par page', async () => {
    for (let i = 0; i < 25; i++)
      store.addVideo(store.addSeries({ slug: `s${i}`, title: `S${i}` }));
    const p1 = await svc.listSeries({ limit: 500 });
    expect(p1.items).toHaveLength(20);
    expect(p1.total).toBe(25);
    expect((await svc.listSeries({ page: 2, limit: 20 })).items).toHaveLength(5);
    expect((await svc.listSeries({ limit: 10 })).items).toHaveLength(10);
  });
  it('getSeries : vidéos publiées ordonnées, sans clé S3, brouillon → 404', async () => {
    const s = store.addSeries();
    store.addVideo(s, { slug: 'b', position: 2 });
    store.addVideo(s, { slug: 'a', position: 1 });
    store.addVideo(s, { slug: 'c', position: 3, status: 'draft' });
    const r = await svc.getSeries('react-avance');
    expect(r.videos.map((v) => v.slug)).toEqual(['a', 'b']);
    expect(JSON.stringify(r)).not.toMatch(/videoKey|videos\/react-avance/);
    store.addSeries({ slug: 'cache', status: 'draft' });
    await expect(svc.getSeries('cache')).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.getSeries('inconnue')).rejects.toBeInstanceOf(NotFoundError);
  });
  it('getVideo : précédente et suivante calculées par position, parmi les publiées', async () => {
    const s = store.addSeries();
    store.addVideo(s, { slug: 'v1', position: 1 });
    store.addVideo(s, { slug: 'v2', position: 2, status: 'draft' });
    store.addVideo(s, { slug: 'v3', position: 3 });
    store.addVideo(s, { slug: 'v4', position: 4 });
    const mid = await svc.getVideo('react-avance', 'v3');
    expect(mid.previous.slug).toBe('v1');
    expect(mid.next.slug).toBe('v4');
    expect((await svc.getVideo('react-avance', 'v1')).previous).toBeNull();
    expect((await svc.getVideo('react-avance', 'v4')).next).toBeNull();
    await expect(svc.getVideo('react-avance', 'v2')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
  it('registerView incrémente via le repository (le SQL ignore les brouillons)', async () => {
    const s = store.addSeries();
    const v = store.addVideo(s);
    const d = store.addVideo(s, { status: 'draft' });
    await svc.registerView(v.id);
    await svc.registerView(d.id);
    expect(store.videos.find((x) => x.id === v.id).views).toBe(1);
    expect(store.videos.find((x) => x.id === d.id).views).toBe(0);
  });
});

describe('validateChapters', () => {
  it('accepte des temps strictement croissants sous la durée', () => {
    expect(() =>
      validateChapters(
        [
          { t: 0, label: 'a' },
          { t: 10, label: 'b' },
        ],
        100
      )
    ).not.toThrow();
    expect(() => validateChapters([], 100)).not.toThrow();
    expect(() => validateChapters(undefined, 100)).not.toThrow();
  });
  it('refuse les temps égaux, décroissants ou ≥ durée', () => {
    expect(() =>
      validateChapters(
        [
          { t: 5, label: 'a' },
          { t: 5, label: 'b' },
        ],
        100
      )
    ).toThrow(ValidationError);
    expect(() =>
      validateChapters(
        [
          { t: 9, label: 'a' },
          { t: 2, label: 'b' },
        ],
        100
      )
    ).toThrow(ValidationError);
    expect(() => validateChapters([{ t: 100, label: 'a' }], 100)).toThrow(/dépasse/);
  });
});

describe('VideoService — administration des vidéos', () => {
  let series;
  const dto = (o = {}) => ({
    seriesId: series.id,
    title: 'Intro',
    slug: 'intro',
    videoKey: 'videos/react-avance/01-intro.mp4',
    durationSeconds: 600,
    ...o,
  });
  beforeEach(() => {
    series = store.addSeries();
    storage.files.set('videos/react-avance/01-intro.mp4', 512_000_000);
    storage.files.set('posters/react-avance/01-intro.jpg', 1000);
  });

  it('crée un brouillon : taille RÉELLE lue sur S3, position suivante, pas de notification', async () => {
    const v = await svc.createVideo(dto({ sizeBytes: 1 }));
    expect(v.sizeBytes).toBe(512_000_000);
    expect(v.position).toBe(1);
    expect(v.status).toBe('draft');
    expect(v.publishedAt).toBeNull();
    expect(notifier.notifyVideoPublished).not.toHaveBeenCalled();
  });
  it('refuse un fichier absent du bucket', async () => {
    storage.files.clear();
    await expect(svc.createVideo(dto())).rejects.toThrow(/introuvable dans le bucket/);
    expect(store.videos).toHaveLength(0);
  });
  it("refuse une clé qui n'appartient pas à la série (pas de vidéo d'une autre série)", async () => {
    storage.files.set('videos/autre-serie/01-x.mp4', 10);
    await expect(
      svc.createVideo(dto({ videoKey: 'videos/autre-serie/01-x.mp4' }))
    ).rejects.toThrow(/doit commencer par videos\/react-avance\//);
    await expect(
      svc.createVideo(dto({ posterKey: 'posters/autre/01.jpg' }))
    ).rejects.toThrow(/Affiche/);
  });
  it('refuse des chapitres incohérents et une série inconnue', async () => {
    await expect(
      svc.createVideo(dto({ chapters: [{ t: 700, label: 'x' }] }))
    ).rejects.toThrow(/dépasse/);
    await expect(svc.createVideo(dto({ seriesId: 'inconnue' }))).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
  it('slug en double dans la série → erreur claire', async () => {
    await svc.createVideo(dto());
    await expect(svc.createVideo(dto())).rejects.toThrow(/existe déjà/);
  });
  it('publication : date posée et notification (série publiée)', async () => {
    const v = await svc.createVideo(
      dto({ status: 'published', posterKey: 'posters/react-avance/01-intro.jpg' })
    );
    expect(v.publishedAt).toBe('2026-05-01T10:00:00.000Z');
    expect(notifier.notifyVideoPublished).toHaveBeenCalledTimes(1);
    expect(notifier.notifyVideoPublished.mock.calls[0][1].slug).toBe('react-avance');
  });
  it('vidéo publiée dans une série en brouillon : aucune notification', async () => {
    const draft = store.addSeries({ slug: 'brouillon', status: 'draft' });
    storage.files.set('videos/brouillon/01-a.mp4', 5);
    await svc.createVideo({
      seriesId: draft.id,
      title: 'A',
      slug: 'a',
      videoKey: 'videos/brouillon/01-a.mp4',
      durationSeconds: 60,
      status: 'published',
    });
    expect(notifier.notifyVideoPublished).not.toHaveBeenCalled();
  });
  it('passage brouillon → publié notifie UNE fois ; republier ou modifier ne renotifie pas', async () => {
    const v = await svc.createVideo(dto());
    await svc.updateVideo(v.id, { status: 'published' });
    expect(notifier.notifyVideoPublished).toHaveBeenCalledTimes(1);
    await svc.updateVideo(v.id, { status: 'published', title: 'Titre modifié' });
    await svc.updateVideo(v.id, { title: 'Encore' });
    expect(notifier.notifyVideoPublished).toHaveBeenCalledTimes(1);
  });
  it('retour en brouillon : publishedAt effacé', async () => {
    const v = await svc.createVideo(dto({ status: 'published' }));
    const d = await svc.updateVideo(v.id, { status: 'draft' });
    expect(d.publishedAt).toBeNull();
  });
  it("une panne de notification n'annule pas la publication", async () => {
    notifier.notifyVideoPublished.mockRejectedValue(new Error('x'));
    const v = await svc.createVideo(dto({ status: 'published' }));
    expect(v.status).toBe('published');
    expect(logger.error).toHaveBeenCalled();
  });
  it('updateVideo : changement de fichier revérifié ; chapitres validés avec la durée courante', async () => {
    const v = await svc.createVideo(dto());
    await expect(
      svc.updateVideo(v.id, { videoKey: 'videos/react-avance/09-absent.mp4' })
    ).rejects.toThrow(/introuvable/);
    await expect(
      svc.updateVideo(v.id, { chapters: [{ t: 9999, label: 'x' }] })
    ).rejects.toThrow(/dépasse/);
    await expect(svc.updateVideo('inconnu', { title: 'x' })).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
  it('suppression : ligne puis fichiers S3 (vidéo et affiche) ; échec S3 journalisé sans erreur', async () => {
    const v = await svc.createVideo(
      dto({ posterKey: 'posters/react-avance/01-intro.jpg' })
    );
    await svc.deleteVideo(v.id);
    expect(store.videos).toHaveLength(0);
    expect(storage.removed.sort()).toEqual([
      'posters/react-avance/01-intro.jpg',
      'videos/react-avance/01-intro.mp4',
    ]);
    await expect(svc.deleteVideo('inconnu')).rejects.toBeInstanceOf(NotFoundError);
  });
  it("suppression d'une série : cascade + fichiers S3 de toutes ses vidéos", async () => {
    storage.files.set('videos/react-avance/02-b.mp4', 5);
    const a = store.addVideo(series, {
      slug: 'a',
      videoKey: 'videos/react-avance/01-intro.mp4',
      posterKey: null,
    });
    store.addVideo(series, {
      slug: 'b',
      videoKey: 'videos/react-avance/02-b.mp4',
      posterKey: null,
    });
    await svc.deleteSeries(series.id);
    expect(store.videos).toHaveLength(0);
    expect(storage.removed).toEqual([
      'videos/react-avance/01-intro.mp4',
      'videos/react-avance/02-b.mp4',
    ]);
    expect(a).toBeDefined();
    storage.failRemove = true;
    const s2 = store.addSeries({ slug: 's2' });
    store.addVideo(s2);
    await svc.deleteSeries(s2.id);
    expect(logger.error).toHaveBeenCalled();
  });
  it('réordonne ; une liste incomplète est refusée (ValidationError)', async () => {
    const a = store.addVideo(series, { slug: 'a' });
    const b = store.addVideo(series, { slug: 'b' });
    const res = await svc.orderVideos(series.id, [b.id, a.id]);
    expect(res.videos.map((v) => v.slug)).toEqual(['b', 'a']);
    await expect(svc.orderVideos(series.id, [a.id])).rejects.toBeInstanceOf(
      ValidationError
    );
  });
  it('séries admin : brouillons inclus, avec compteurs ; slug de série dupliqué refusé', async () => {
    store.addSeries({ slug: 'brouillon', status: 'draft' });
    store.addVideo(series, { status: 'draft' });
    store.addVideo(series);
    const list = await svc.listSeriesAdmin();
    expect(list.map((s) => s.slug).sort()).toEqual(['brouillon', 'react-avance']);
    expect(list.find((s) => s.slug === 'react-avance')).toMatchObject({
      videoCount: 2,
      publishedCount: 1,
    });
    await expect(svc.createSeries({ title: 'X', slug: 'react-avance' })).rejects.toThrow(
      /déjà utilisé/
    );
    await expect(svc.updateSeries('inconnu', { title: 'x' })).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(svc.getSeriesAdmin('inconnu')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('VideoUploadService', () => {
  let series, up;
  beforeEach(() => {
    series = store.addSeries();
    up = new VideoUploadService(store.seriesRepo, store.videoRepo, storage, {
      maxVideoBytes: 3 * 1024 ** 3,
    });
  });
  it('génère la clé côté serveur : videos/<série>/<NN>-<slug>.mp4, URL valable 15 min', async () => {
    store.addVideo(series);
    const r = await up.createUpload({
      seriesId: series.id,
      videoSlug: 'intro',
      contentType: 'video/mp4',
      size: 1000,
    });
    expect(r.key).toBe('videos/react-avance/02-intro.mp4');
    expect(r.expiresIn).toBe(900);
    expect(storage.uploads[0]).toEqual({ key: r.key, type: 'video/mp4', expires: 900 });
    expect(r.uploadUrl).toContain(r.key);
  });
  it('position explicite et affiche (jpg/png/webp) dans posters/', async () => {
    const r = await up.createUpload({
      seriesId: series.id,
      videoSlug: 'intro',
      kind: 'poster',
      contentType: 'image/webp',
      size: 1000,
      position: 7,
    });
    expect(r.key).toBe('posters/react-avance/07-intro.webp');
  });
  it.each([
    ['un type autre que mp4', { contentType: 'video/quicktime', size: 10 }, /video\/mp4/],
    [
      'un fichier trop gros',
      { contentType: 'video/mp4', size: 3 * 1024 ** 3 + 1 },
      /trop volumineux/,
    ],
    [
      'une affiche gif',
      { kind: 'poster', contentType: 'image/gif', size: 10 },
      /JPEG, PNG ou WebP/,
    ],
    [
      'une affiche trop lourde',
      { kind: 'poster', contentType: 'image/png', size: 6 * 1024 * 1024 },
      /5 Mo/,
    ],
  ])('refuse %s', async (_n, extra, msg) => {
    await expect(
      up.createUpload({ seriesId: series.id, videoSlug: 'intro', ...extra })
    ).rejects.toThrow(msg);
    expect(storage.uploads).toHaveLength(0);
  });
  it('série inconnue : 404', async () => {
    await expect(
      up.createUpload({
        seriesId: 'x',
        videoSlug: 'a',
        contentType: 'video/mp4',
        size: 1,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('PlaybackService (URL signées, addendum E)', () => {
  const NOW = new Date('2026-05-01T10:00:00Z');
  let signer, pb, series;
  beforeEach(() => {
    signer = {
      sign: vi.fn((key, exp) => `${CDN}/${key}?Expires=${exp.getTime()}&Signature=sig`),
    };
    pb = new PlaybackService(store.videoRepo, store.seriesRepo, signer, {
      clock: () => NOW,
    });
    series = store.addSeries();
  });
  it('signe la clé de la vidéo ; validité = durée + 1 h, minimum 2 h', async () => {
    const long = store.addVideo(series, { slug: 'long', durationSeconds: 3 * 3600 });
    const short = store.addVideo(series, { slug: 'short', durationSeconds: 600 });
    const a = await pb.createPlayback(long.id);
    expect(new Date(a.expiresAt).getTime() - NOW.getTime()).toBe(4 * 3600 * 1000);
    const b = await pb.createPlayback(short.id);
    expect(new Date(b.expiresAt).getTime() - NOW.getTime()).toBe(2 * 3600 * 1000);
    expect(signer.sign.mock.calls[1][0]).toBe(short.videoKey);
    expect(b.url).toContain('Signature=');
  });
  it("vidéo en brouillon, série en brouillon ou id inconnu : 404, rien n'est signé", async () => {
    const draft = store.addVideo(series, { slug: 'd', status: 'draft' });
    const hidden = store.addSeries({ slug: 'h', status: 'draft' });
    const inHidden = store.addVideo(hidden);
    for (const id of [draft.id, inHidden.id, 'inconnu'])
      await expect(pb.createPlayback(id)).rejects.toBeInstanceOf(NotFoundError);
    expect(signer.sign).not.toHaveBeenCalled();
  });
});

describe('NotificationService.notifyVideoPublished', () => {
  it('courriel (échappé, lien de la vidéo) + push « Nouvelle vidéo »', async () => {
    const news = new MemoryNewsletterRepo();
    const push = new MemoryPushRepo();
    const email = { send: vi.fn().mockResolvedValue(undefined) };
    const fcm = {
      sendToTokens: vi
        .fn()
        .mockResolvedValue({ successCount: 1, failureCount: 0, invalidTokens: [] }),
    };
    const s = await news.create('ok@x.com');
    await news.update(s.id, { confirmedAt: '2026-01-01T00:00:00Z' });
    await push.upsert('tok-aaaaaaaaaaaaaaaaaaaa');
    const n = new NotificationService(news, push, email, fcm, {
      siteUrl: 'https://site.ex',
      publicApiUrl: 'https://api.ex',
      logger,
    });
    const series = store.addSeries();
    const video = store.addVideo(series, {
      title: 'Hooks <b>avancés</b>',
      description: 'Un <script>x</script> résumé',
    });
    await n.notifyVideoPublished(video, series);
    const mail = email.send.mock.calls[0][0];
    expect(mail.subject).toBe('Nouvelle vidéo : Hooks <b>avancés</b>');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>avancés</b>');
    expect(mail.html).toContain('https://site.ex/formations/react-avance/video-1');
    expect(mail.html).toContain(`unsubscribe?token=${s.unsubscribeToken}`);
    expect(fcm.sendToTokens).toHaveBeenCalledWith(['tok-aaaaaaaaaaaaaaaaaaaa'], {
      title: 'Nouvelle vidéo',
      body: video.title,
      url: 'https://site.ex/formations/react-avance/video-1',
    });
  });
});
