import VideoService from './VideoService.js';
import ProgressService from './ProgressService.js';
import VideoAdminService from './VideoAdminService.js';
import ProgressRepository from '../../dal/repositories/ProgressRepository.js';
import VideoRepository from '../../dal/repositories/VideoRepository.js';

class Mem {
  constructor() {
    this.d = {};
  }
  get(id) {
    return this.d[id] || null;
  }
  set(id, v) {
    this.d[id] = v;
  }
}

describe('VideoService (client)', () => {
  it('toQuery retire les filtres vides et « all »', () => {
    expect(
      VideoService.toQuery({ category: 'all', level: 'all', tag: '', q: '  ' })
    ).toEqual({});
    expect(
      VideoService.toQuery({
        category: 'React',
        level: 'advanced',
        tag: 'hooks',
        q: ' redux ',
      })
    ).toEqual({ category: 'React', level: 'advanced', tag: 'hooks', q: 'redux' });
  });
  it('listSeries normalise une réponse incomplète ; registerView ne lève jamais', async () => {
    const repo = {
      listSeries: vi.fn().mockResolvedValue(null),
      registerView: vi.fn().mockRejectedValue(new Error('x')),
    };
    const s = new VideoService(repo);
    expect(await s.listSeries()).toEqual({ items: [], total: 0, page: 1 });
    await expect(s.registerView('v')).resolves.toBeUndefined();
  });
  it('currentChapter délègue au modèle', () => {
    expect(VideoService.currentChapter([{ t: 0 }, { t: 50 }], 70)).toBe(1);
  });
});

describe('ProgressService', () => {
  let repo, p;
  beforeEach(() => {
    repo = new Mem();
    p = new ProgressService(repo);
  });
  it('savePosition : position entière ; « vue » à partir de 95 %', () => {
    p.savePosition('a', 120.7, 1000);
    expect(repo.get('a')).toMatchObject({ position: 120, watched: false });
    p.savePosition('a', 960, 1000);
    expect(p.isWatched('a')).toBe(true);
  });
  it('une vidéo déjà vue le reste même si on la relit au début', () => {
    p.markWatched('a', 600);
    p.savePosition('a', 5, 600);
    expect(p.isWatched('a')).toBe(true);
  });
  it('resumePosition : reprend, sauf si jamais lue, vue, ou à moins de 10 s de la fin', () => {
    expect(p.resumePosition('x', 600)).toBe(0);
    p.savePosition('a', 200, 600);
    expect(p.resumePosition('a', 600)).toBe(200);
    p.savePosition('b', 595, 600);
    expect(p.resumePosition('b', 600)).toBe(0);
    p.markWatched('c', 600);
    expect(p.resumePosition('c', 600)).toBe(0);
  });
  it('seriesProgress : pourcentage, compte et prochaine vidéo non vue', () => {
    const vids = [
      { id: '1', slug: 'a' },
      { id: '2', slug: 'b' },
      { id: '3', slug: 'c' },
      { id: '4', slug: 'd' },
    ];
    p.markWatched('1', 10);
    p.markWatched('2', 10);
    expect(p.seriesProgress(vids)).toMatchObject({
      watchedCount: 2,
      total: 4,
      percent: 50,
    });
    expect(p.seriesProgress(vids).nextVideo.slug).toBe('c');
    p.markWatched('3', 1);
    p.markWatched('4', 1);
    expect(p.seriesProgress(vids)).toMatchObject({ percent: 100, nextVideo: null });
    expect(new ProgressService(new Mem()).seriesProgress([])).toMatchObject({
      percent: 0,
      total: 0,
      nextVideo: null,
    });
  });
});

describe('ProgressRepository (stockage injecté)', () => {
  it('écrit et relit en JSON avec horodatage', () => {
    const data = {};
    const storage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v) };
    const r = new ProgressRepository(storage);
    r.set('v1', { position: 5 });
    expect(Object.keys(data)[0]).toBe('progress:v1:v1');
    expect(r.get('v1')).toMatchObject({ position: 5 });
    expect(typeof r.get('v1').updatedAt).toBe('number');
    expect(r.get('absente')).toBeNull();
  });
  it('stockage indisponible (mode privé, quota) ou JSON corrompu : aucune exception', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    };
    const r = new ProgressRepository(broken);
    expect(() => r.set('a', {})).not.toThrow();
    expect(r.get('a')).toBeNull();
    expect(
      new ProgressRepository({ getItem: () => '{pas du json', setItem() {} }).get('a')
    ).toBeNull();
  });
});

describe('VideoRepository (chemins)', () => {
  it('encode les slugs et ids ; la lecture est un POST (jamais mise en cache)', () => {
    const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    const r = new VideoRepository(api);
    r.getVideo('a b', 'c/d');
    r.playback('id1');
    r.registerView('id1');
    r.orderVideos('s1', ['a', 'b']);
    r.requestUploadUrl({ x: 1 });
    expect(api.get).toHaveBeenCalledWith('/video-series/a%20b/videos/c%2Fd');
    expect(api.post).toHaveBeenCalledWith('/videos/id1/playback');
    expect(api.post).toHaveBeenCalledWith('/videos/id1/view');
    expect(api.put).toHaveBeenCalledWith('/video-series/s1/order', {
      videoIds: ['a', 'b'],
    });
    expect(api.post).toHaveBeenCalledWith('/admin/videos/upload-url', { x: 1 });
  });
});

describe('VideoAdminService (formulaires et envoi)', () => {
  const base = {
    title: 'Intro',
    slug: 'intro',
    duration: '10:00',
    videoKey: 'videos/s/01-intro.mp4',
    chapters: [],
    resources: [],
    status: 'draft',
  };
  it('validateSeries : titre et slug', () => {
    expect(VideoAdminService.validateSeries({ title: '', slug: 'a' })).toMatch(/titre/i);
    expect(VideoAdminService.validateSeries({ title: 'T', slug: 'Pas Valide' })).toMatch(
      /slug/i
    );
    expect(VideoAdminService.validateSeries({ title: 'T', slug: 'ok-1' })).toBeNull();
  });
  it('toSeriesDto : étiquettes dédoublonnées, langue en minuscules, nombres', () => {
    expect(
      VideoAdminService.toSeriesDto({
        title: ' T ',
        slug: 'ok',
        description: ' ',
        category: '',
        level: 'advanced',
        tags: 'a, b ,a,,',
        language: 'FR',
        status: 'published',
        featured: 1,
        sortOrder: '3',
      })
    ).toEqual({
      title: 'T',
      slug: 'ok',
      description: null,
      category: null,
      level: 'advanced',
      tags: ['a', 'b'],
      language: 'fr',
      status: 'published',
      featured: true,
      sortOrder: 3,
    });
  });
  it('validateVideo : durée, fichier, chapitres croissants et sous la durée', () => {
    expect(VideoAdminService.validateVideo(base)).toBeNull();
    expect(VideoAdminService.validateVideo({ ...base, duration: '1h' })).toMatch(/Durée/);
    expect(VideoAdminService.validateVideo({ ...base, videoKey: '' })).toMatch(
      /fichier vidéo/
    );
    expect(
      VideoAdminService.validateVideo({ ...base, videoKey: '', file: {} })
    ).toBeNull();
    expect(
      VideoAdminService.validateVideo({
        ...base,
        chapters: [
          { time: '5:00', label: 'a' },
          { time: '2:00', label: 'b' },
        ],
      })
    ).toMatch(/croissants/);
    expect(
      VideoAdminService.validateVideo({
        ...base,
        chapters: [{ time: '10:00', label: 'a' }],
      })
    ).toMatch(/dépasse/);
    expect(
      VideoAdminService.validateVideo({ ...base, chapters: [{ time: 'x', label: 'a' }] })
    ).toMatch(/temps invalide/);
    expect(
      VideoAdminService.validateVideo({
        ...base,
        chapters: [{ time: '1:00', label: ' ' }],
      })
    ).toMatch(/libellé/);
    expect(VideoAdminService.validateVideo({ ...base, slug: 'Mauvais Slug' })).toMatch(
      /slug/i
    );
  });
  it('toVideoDto : secondes, chapitres typés, ressources incomplètes ignorées, clés envoyées prioritaires', () => {
    const dto = VideoAdminService.toVideoDto(
      {
        ...base,
        description: '',
        posterKey: '',
        chapters: [{ time: '1:30', label: ' Début ' }],
        resources: [
          { label: 'Dépôt', url: 'https://g.co' },
          { label: '', url: 'https://x' },
        ],
      },
      { videoKey: 'videos/s/09-new.mp4' }
    );
    expect(dto).toEqual({
      title: 'Intro',
      slug: 'intro',
      description: null,
      videoKey: 'videos/s/09-new.mp4',
      posterKey: null,
      durationSeconds: 600,
      chapters: [{ t: 90, label: 'Début' }],
      resources: [{ label: 'Dépôt', url: 'https://g.co' }],
      status: 'draft',
    });
  });
  it('moveId : échange avec le voisin, inchangé aux extrémités', () => {
    const v = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(VideoAdminService.moveId(v, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(VideoAdminService.moveId(v, 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(VideoAdminService.moveId(v, 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(VideoAdminService.moveId(v, 'c', 1)).toEqual(['a', 'b', 'c']);
    expect(VideoAdminService.moveId(v, 'zz', 1)).toEqual(['a', 'b', 'c']);
  });
  it("uploadFile : demande l'URL (le serveur choisit la clé), envoie avec le même type, renvoie la clé", async () => {
    const repo = {
      requestUploadUrl: vi
        .fn()
        .mockResolvedValue({ uploadUrl: 'https://s3/put', key: 'videos/s/01-intro.mp4' }),
    };
    const up = { upload: vi.fn().mockResolvedValue() };
    const file = { type: 'video/mp4', size: 123, name: 'mon fichier.mp4' };
    const opts = { onProgress: () => {} };
    const key = await new VideoAdminService(repo, up).uploadFile(
      { seriesId: 's1', videoSlug: 'intro', kind: 'video', file },
      opts
    );
    expect(key).toBe('videos/s/01-intro.mp4');
    expect(repo.requestUploadUrl).toHaveBeenCalledWith({
      seriesId: 's1',
      videoSlug: 'intro',
      kind: 'video',
      contentType: 'video/mp4',
      size: 123,
    });
    expect(JSON.stringify(repo.requestUploadUrl.mock.calls[0][0])).not.toContain(
      'mon fichier'
    ); // jamais le nom de fichier local
    expect(up.upload).toHaveBeenCalledWith('https://s3/put', file, 'video/mp4', opts);
  });
});
