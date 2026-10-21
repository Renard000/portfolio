import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCertifications = createAsyncThunk(
  'certifications/fetch',
  async (params, { extra }) => extra.certificationService.list(params)
);
export const createCertification = createAsyncThunk(
  'certifications/create',
  async (dto, { extra }) => extra.certificationService.create(dto)
);
export const updateCertification = createAsyncThunk(
  'certifications/update',
  async ({ id, dto }, { extra }) => extra.certificationService.update(id, dto)
);
export const deleteCertification = createAsyncThunk(
  'certifications/delete',
  async (id, { extra }) => {
    await extra.certificationService.remove(id);
    return id;
  }
);

export const defaultFilters = { q: '', issuer: '', category: '', sort: 'date_desc' };

const slice = createSlice({
  name: 'certifications',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
    error: null,
    filters: defaultFilters,
    view: 'grid',
    saving: false,
    saveError: null,
  },
  reducers: {
    setFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    resetFilters(state) {
      state.filters = defaultFilters;
    },
    setView(state, { payload }) {
      state.view = payload === 'carousel' ? 'carousel' : 'grid';
    },
    clearSaveError(state) {
      state.saveError = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchCertifications.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchCertifications.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.loaded = true;
        s.items = payload;
      })
      .addCase(fetchCertifications.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(createCertification.pending, (s) => {
        s.saving = true;
        s.saveError = null;
      })
      .addCase(createCertification.fulfilled, (s, { payload }) => {
        s.saving = false;
        s.items.push(payload);
      })
      .addCase(createCertification.rejected, (s, { error }) => {
        s.saving = false;
        s.saveError = error.message;
      })
      .addCase(updateCertification.pending, (s) => {
        s.saving = true;
        s.saveError = null;
      })
      .addCase(updateCertification.fulfilled, (s, { payload }) => {
        s.saving = false;
        s.items = s.items.map((c) => (c.id === payload.id ? payload : c));
      })
      .addCase(updateCertification.rejected, (s, { error }) => {
        s.saving = false;
        s.saveError = error.message;
      })
      .addCase(deleteCertification.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((c) => c.id !== payload);
      })
      .addCase(deleteCertification.rejected, (s, { error }) => {
        s.error = error.message;
      });
  },
});

export const { setFilter, resetFilters, setView, clearSaveError } = slice.actions;
export default slice.reducer;
