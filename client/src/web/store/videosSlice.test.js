import { createStore } from './store.js';
import {
  fetchSeriesList,
  fetchLatestSeries,
  fetchSeries,
  fetchVideo,
  fetchPlayback,
  setSeriesFilter,
  clearPlayback,
} from './slices/videosSlice.js';
import {
  loadSeriesProgress,
  markWatched,
  savePosition,
  getResumePosition,
} from './slices/progressSlice.js';
import {
  fetchAdminSeries,
  orderVideos,
  deleteVideo,
  saveVideo,
  saveSeries,
  fetchAdminSeriesDetail,
} from './slices/adminVideosSlice.js';
import ProgressService from '../../bll/services/ProgressService.js';

const mk = (over = {}) => {
  const mem = {};
  const services = {
    videoService: {
      listSeries: vi.fn().mockResolvedValue({
        items: [
          { slug: 'a', category: 'React' },
          { slug: 'b', category: 'Node' },
        ],
        total: 2,
        page: 1,
      }),
      getSeries: vi.fn().mockResolvedValue({
        slug: 'a',
        videos: [
          { id: 'v1', slug: 'x' },
          { id: 'v2', slug: 'y' },
        ],
      }),
      getVideo: vi.fn().mockResolvedValue({ video: { id: 'v1' } }),
      getPlayback: vi
        .fn()
        .mockResolvedValue({ url: 'https://cdn/x?Signature=s', expiresAt: 'e' }),
      registerView: vi.fn(),
    },
    progressService: new ProgressService({
      get: (k) => mem[k] || null,
      set: (k, v) => (mem[k] = v),
    }),
    videoAdminService: {
      listSeries: vi.fn().mockResolvedValue([{ id: 's1' }]),
      getSeries: vi
        .fn()
        .mockResolvedValue({ id: 's1', videos: [{ id: 'a' }, { id: 'b' }] }),
      updateSeries: vi.fn().mockResolvedValue({}),
      createSeries: vi.fn().mockResolvedValue({}),
      createVideo: vi.fn().mockResolvedValue({}),
      updateVideo: vi.fn().mockResolvedValue({}),
      deleteVideo: vi.fn().mockResolvedValue(),
      orderVideos: vi
        .fn()
        .mockResolvedValue({ id: 's1', videos: [{ id: 'b' }, { id: 'a' }] }),
    },
    ...over,
  };
  return { services, store: createStore(services) };
};

describe('videosSlice', () => {
  it('liste : les filtres sont convertis en requête (« all » retiré)', async () => {
    const { store, services } = mk();
    store.dispatch(setSeriesFilter({ category: 'React', level: 'all', q: 'hooks' }));
    await store.dispatch(fetchSeriesList());
    expect(services.videoService.listSeries).toHaveBeenCalledWith({
      category: 'React',
      q: 'hooks',
    });
    expect(store.getState().videos.list.total).toBe(2);
  });
  it('catégories mémorisées à partir de la liste non filtrée, conservées ensuite', async () => {
    const { store, services } = mk();
    await store.dispatch(fetchSeriesList());
    expect(store.getState().videos.list.categories).toEqual(['React', 'Node']);
    services.videoService.listSeries.mockResolvedValue({
      items: [{ slug: 'b', category: 'Node' }],
      total: 1,
      page: 1,
    });
    store.dispatch(setSeriesFilter({ category: 'Node' }));
    await store.dispatch(fetchSeriesList());
    expect(store.getState().videos.list.categories).toEqual(['React', 'Node']);
  });
  it('erreur de liste ; séries récentes ; série ; vidéo', async () => {
    const bad = mk({
      videoService: { listSeries: vi.fn().mockRejectedValue(new Error('KO')) },
    });
    await bad.store.dispatch(fetchSeriesList());
    expect(bad.store.getState().videos.list.error).toBe('KO');
    const { store } = mk();
    await store.dispatch(fetchLatestSeries());
    expect(store.getState().videos.latest).toHaveLength(2);
    await store.dispatch(fetchSeries('a'));
    expect(store.getState().videos.series.data.slug).toBe('a');
    await store.dispatch(fetchVideo({ seriesSlug: 'a', videoSlug: 'x' }));
    expect(store.getState().videos.player.data.video.id).toBe('v1');
  });
  it("l'URL signée est vidée dès qu'on change de vidéo et par clearPlayback", async () => {
    const { store } = mk();
    await store.dispatch(fetchPlayback('v1'));
    expect(store.getState().videos.playback.url).toContain('Signature');
    const p = store.dispatch(fetchVideo({ seriesSlug: 'a', videoSlug: 'y' }));
    expect(store.getState().videos.playback.url).toBeNull();
    await p;
    await store.dispatch(fetchPlayback('v1'));
    store.dispatch(clearPlayback());
    expect(store.getState().videos.playback).toEqual({
      url: null,
      expiresAt: null,
      loading: false,
      error: null,
    });
  });
  it("échec de l'URL signée : erreur exposée, aucune URL", async () => {
    const { store } = mk({
      videoService: {
        getPlayback: vi.fn().mockRejectedValue(new Error('Trop de requêtes')),
      },
    });
    await store.dispatch(fetchPlayback('v1'));
    expect(store.getState().videos.playback).toMatchObject({
      url: null,
      error: 'Trop de requêtes',
    });
  });
});

describe('progressSlice', () => {
  it('reprise, sauvegarde, « vue » et progression de série', async () => {
    const { store } = mk();
    await store.dispatch(savePosition({ videoId: 'v1', seconds: 120, duration: 600 }));
    expect(
      await store.dispatch(getResumePosition({ videoId: 'v1', duration: 600 })).unwrap()
    ).toBe(120);
    await store.dispatch(markWatched({ videoId: 'v1', duration: 600 }));
    await store.dispatch(
      loadSeriesProgress([
        { id: 'v1', slug: 'x' },
        { id: 'v2', slug: 'y' },
      ])
    );
    expect(store.getState().progress.series).toEqual({
      watchedIds: ['v1'],
      watchedCount: 1,
      total: 2,
      percent: 50,
      nextSlug: 'y',
    });
    await store.dispatch(markWatched({ videoId: 'v2', duration: 1 }));
    expect(store.getState().progress.series.watchedIds).toEqual(['v1', 'v2']);
  });
});

describe('adminVideosSlice', () => {
  it('liste, détail, ordre (remplace la série), suppression locale', async () => {
    const { store } = mk();
    await store.dispatch(fetchAdminSeries());
    expect(store.getState().adminVideos.list).toHaveLength(1);
    await store.dispatch(fetchAdminSeriesDetail('s1'));
    await store.dispatch(orderVideos({ seriesId: 's1', videoIds: ['b', 'a'] }));
    expect(store.getState().adminVideos.current.videos.map((v) => v.id)).toEqual([
      'b',
      'a',
    ]);
    expect(store.getState().adminVideos.saving).toBe(false);
    await store.dispatch(deleteVideo('b'));
    expect(store.getState().adminVideos.current.videos.map((v) => v.id)).toEqual(['a']);
  });
  it('saveVideo recharge la série ; erreurs exposées et saving remis à faux', async () => {
    const { store, services } = mk();
    await store.dispatch(saveVideo({ dto: { seriesId: 's1', title: 'x' } }));
    expect(services.videoAdminService.createVideo).toHaveBeenCalled();
    expect(services.videoAdminService.getSeries).toHaveBeenCalledWith('s1');
    await store.dispatch(saveVideo({ id: 'v9', dto: { title: 'y' } }));
    expect(services.videoAdminService.updateVideo).toHaveBeenCalledWith('v9', {
      title: 'y',
    });
    const bad = mk({
      videoAdminService: {
        createSeries: vi
          .fn()
          .mockRejectedValue(new Error('Ce slug de série est déjà utilisé')),
      },
    });
    await bad.store.dispatch(saveSeries({ dto: {} }));
    expect(bad.store.getState().adminVideos).toMatchObject({
      error: 'Ce slug de série est déjà utilisé',
      saving: false,
    });
  });
});
