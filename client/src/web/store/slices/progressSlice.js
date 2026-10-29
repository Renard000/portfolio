import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/** Lecture de la progression locale d'une série : { watchedIds, watchedCount, total, percent, nextSlug }. */
export const loadSeriesProgress = createAsyncThunk(
  'progress/loadSeries',
  async (videos, { extra }) => {
    const p = extra.progressService.seriesProgress(videos);
    return {
      watchedIds: videos
        .filter((v) => extra.progressService.isWatched(v.id))
        .map((v) => v.id),
      watchedCount: p.watchedCount,
      total: p.total,
      percent: p.percent,
      nextSlug: p.nextVideo ? p.nextVideo.slug : null,
    };
  }
);
export const savePosition = createAsyncThunk(
  'progress/save',
  async ({ videoId, seconds, duration }, { extra }) => {
    extra.progressService.savePosition(videoId, seconds, duration);
  }
);
export const markWatched = createAsyncThunk(
  'progress/watched',
  async ({ videoId, duration }, { extra }) => {
    extra.progressService.markWatched(videoId, duration);
    return videoId;
  }
);
/** Seconde de reprise (0 si jamais lue ou terminée) : renvoyée à l'appelant via unwrap(). */
export const getResumePosition = createAsyncThunk(
  'progress/resume',
  async ({ videoId, duration }, { extra }) =>
    extra.progressService.resumePosition(videoId, duration)
);

const empty = { watchedIds: [], watchedCount: 0, total: 0, percent: 0, nextSlug: null };
const slice = createSlice({
  name: 'progress',
  initialState: { series: empty },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadSeriesProgress.fulfilled, (s, { payload }) => {
      s.series = payload;
    }).addCase(markWatched.fulfilled, (s, { payload }) => {
      if (!s.series.watchedIds.includes(payload)) s.series.watchedIds.push(payload);
    });
  },
});

export default slice.reducer;
