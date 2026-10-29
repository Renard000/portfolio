import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import VideoService from '../../../bll/services/VideoService.js';

export const fetchSeriesList = createAsyncThunk(
  'videos/fetchList',
  async (_arg, { extra, getState }) =>
    extra.videoService.listSeries(VideoService.toQuery(getState().videos.filters))
);
/** Séries les plus récentes pour l'accueil (indépendant des filtres de la page Formations). */
export const fetchLatestSeries = createAsyncThunk(
  'videos/fetchLatest',
  async (_arg, { extra }) => (await extra.videoService.listSeries({ limit: 3 })).items
);
export const fetchSeries = createAsyncThunk(
  'videos/fetchSeries',
  async (slug, { extra }) => extra.videoService.getSeries(slug)
);
export const fetchVideo = createAsyncThunk(
  'videos/fetchVideo',
  async ({ seriesSlug, videoSlug }, { extra }) =>
    extra.videoService.getVideo(seriesSlug, videoSlug)
);
/** L'URL signée reste en mémoire (jamais dans localStorage ni dans un état persisté). */
export const fetchPlayback = createAsyncThunk(
  'videos/fetchPlayback',
  async (videoId, { extra }) => extra.videoService.getPlayback(videoId)
);
export const registerView = createAsyncThunk(
  'videos/registerView',
  async (videoId, { extra }) => extra.videoService.registerView(videoId)
);

const slice = createSlice({
  name: 'videos',
  initialState: {
    list: { items: [], total: 0, loading: false, error: null, categories: [] },
    latest: [],
    filters: { category: 'all', level: 'all', tag: '', q: '' },
    series: { data: null, loading: false, error: null },
    player: { data: null, loading: false, error: null },
    playback: { url: null, expiresAt: null, loading: false, error: null },
  },
  reducers: {
    setSeriesFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    clearPlayback(state) {
      state.playback = { url: null, expiresAt: null, loading: false, error: null };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSeriesList.pending, (s) => {
      s.list.loading = true;
      s.list.error = null;
    })
      .addCase(fetchSeriesList.fulfilled, (s, { payload }) => {
        s.list.loading = false;
        s.list.items = payload.items;
        s.list.total = payload.total;
        // Les catégories proposées viennent de la liste NON filtrée (sinon elles disparaîtraient)
        const f = s.filters;
        const unfiltered = f.category === 'all' && f.level === 'all' && !f.tag && !f.q;
        if (unfiltered || !s.list.categories.length)
          s.list.categories = [
            ...new Set(payload.items.map((x) => x.category).filter(Boolean)),
          ];
      })
      .addCase(fetchSeriesList.rejected, (s, { error }) => {
        s.list.loading = false;
        s.list.error = error.message;
      })
      .addCase(fetchLatestSeries.fulfilled, (s, { payload }) => {
        s.latest = payload;
      })
      .addCase(fetchSeries.pending, (s) => {
        s.series = { data: null, loading: true, error: null };
      })
      .addCase(fetchSeries.fulfilled, (s, { payload }) => {
        s.series = { data: payload, loading: false, error: null };
      })
      .addCase(fetchSeries.rejected, (s, { error }) => {
        s.series = { data: null, loading: false, error: error.message };
      })
      .addCase(fetchVideo.pending, (s) => {
        s.player = { data: null, loading: true, error: null };
        s.playback = { url: null, expiresAt: null, loading: false, error: null };
      })
      .addCase(fetchVideo.fulfilled, (s, { payload }) => {
        s.player = { data: payload, loading: false, error: null };
      })
      .addCase(fetchVideo.rejected, (s, { error }) => {
        s.player = { data: null, loading: false, error: error.message };
      })
      .addCase(fetchPlayback.pending, (s) => {
        s.playback.loading = true;
        s.playback.error = null;
      })
      .addCase(fetchPlayback.fulfilled, (s, { payload }) => {
        s.playback = {
          url: payload.url,
          expiresAt: payload.expiresAt,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchPlayback.rejected, (s, { error }) => {
        s.playback = { url: null, expiresAt: null, loading: false, error: error.message };
      });
  },
});

export const { setSeriesFilter, clearPlayback } = slice.actions;
export default slice.reducer;
