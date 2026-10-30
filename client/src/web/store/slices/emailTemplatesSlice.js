import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTemplates = createAsyncThunk(
  'emailTemplates/fetch',
  async (_arg, { extra }) => extra.emailAdminService.listTemplates()
);
export const saveTemplate = createAsyncThunk(
  'emailTemplates/save',
  async ({ key, values }, { extra }) => {
    await extra.emailAdminService.saveTemplate(key, values);
    return { key, values };
  }
);
export const resetTemplate = createAsyncThunk(
  'emailTemplates/reset',
  async (key, { extra }) => extra.emailAdminService.resetTemplate(key)
);
export const previewTemplate = createAsyncThunk(
  'emailTemplates/preview',
  async ({ key, values }, { extra }) =>
    extra.emailAdminService.previewTemplate(key, values)
);
export const testTemplate = createAsyncThunk(
  'emailTemplates/test',
  async ({ key, values, to }, { extra }) =>
    extra.emailAdminService.testTemplate(key, values, to)
);
export const broadcastNews = createAsyncThunk(
  'emailTemplates/broadcast',
  async (values, { extra }) => extra.emailAdminService.broadcast(values)
);

const slice = createSlice({
  name: 'emailTemplates',
  initialState: { items: [], loading: false, error: null, preview: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTemplates.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchTemplates.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = payload;
      })
      .addCase(fetchTemplates.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(saveTemplate.fulfilled, (s, { payload }) => {
        s.items = s.items.map((t) =>
          t.key === payload.key ? { ...t, ...payload.values, customized: true } : t
        );
      })
      .addCase(resetTemplate.fulfilled, (s, { payload }) => {
        s.items = s.items.map((t) => (t.key === payload.key ? payload : t));
      })
      .addCase(previewTemplate.fulfilled, (s, { payload }) => {
        s.preview = payload;
      });
  },
});

export default slice.reducer;
