import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAdminSeries = createAsyncThunk(
  'adminVideos/list',
  async (_a, { extra }) => extra.videoAdminService.listSeries()
);
export const fetchAdminSeriesDetail = createAsyncThunk(
  'adminVideos/detail',
  async (id, { extra }) => extra.videoAdminService.getSeries(id)
);
export const saveSeries = createAsyncThunk(
  'adminVideos/saveSeries',
  async ({ id, dto }, { extra }) =>
    id
      ? extra.videoAdminService.updateSeries(id, dto)
      : extra.videoAdminService.createSeries(dto)
);
export const deleteSeries = createAsyncThunk(
  'adminVideos/deleteSeries',
  async (id, { extra }) => {
    await extra.videoAdminService.deleteSeries(id);
    return id;
  }
);
export const saveVideo = createAsyncThunk(
  'adminVideos/saveVideo',
  async ({ id, dto }, { extra, dispatch }) => {
    if (id) await extra.videoAdminService.updateVideo(id, dto);
    else await extra.videoAdminService.createVideo(dto);
    return dispatch(fetchAdminSeriesDetail(dto.seriesId || id)).unwrap();
  }
);
export const deleteVideo = createAsyncThunk(
  'adminVideos/deleteVideo',
  async (id, { extra }) => {
    await extra.videoAdminService.deleteVideo(id);
    return id;
  }
);
export const orderVideos = createAsyncThunk(
  'adminVideos/order',
  async ({ seriesId, videoIds }, { extra }) =>
    extra.videoAdminService.orderVideos(seriesId, videoIds)
);
/** Envoi direct vers S3 : le signal (AbortSignal) permet « Annuler », onProgress fait avancer la barre. */
export const uploadVideoFile = createAsyncThunk(
  'adminVideos/upload',
  async (arg, { extra }) =>
    extra.videoAdminService.uploadFile(arg, {
      onProgress: arg.onProgress,
      signal: arg.signal,
    })
);

const slice = createSlice({
  name: 'adminVideos',
  initialState: { list: [], current: null, loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAdminSeries.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchAdminSeries.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.list = payload;
      })
      .addCase(fetchAdminSeries.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(fetchAdminSeriesDetail.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchAdminSeriesDetail.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.current = payload;
      })
      .addCase(fetchAdminSeriesDetail.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(deleteSeries.fulfilled, (s, { payload }) => {
        s.list = s.list.filter((x) => x.id !== payload);
      })
      .addCase(orderVideos.fulfilled, (s, { payload }) => {
        s.saving = false;
        s.current = payload;
      })
      .addCase(deleteVideo.fulfilled, (s, { payload }) => {
        if (s.current)
          s.current = {
            ...s.current,
            videos: s.current.videos.filter((v) => v.id !== payload),
          };
      });
    for (const t of [saveSeries, saveVideo, orderVideos])
      b.addCase(t.pending, (s) => {
        s.saving = true;
        s.error = null;
      }).addCase(t.rejected, (s, { error }) => {
        s.saving = false;
        s.error = error.message;
      });
    b.addCase(saveSeries.fulfilled, (s) => {
      s.saving = false;
    }).addCase(saveVideo.fulfilled, (s) => {
      s.saving = false;
    });
  },
});

export default slice.reducer;
