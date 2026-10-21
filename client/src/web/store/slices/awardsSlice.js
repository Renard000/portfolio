import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAwards = createAsyncThunk('awards/fetch', async (_arg, { extra }) =>
  extra.awardService.list()
);
// Après une écriture admin, on recharge : les totaux restent calculés par le serveur/la BLL.
export const createAward = createAsyncThunk(
  'awards/create',
  async (dto, { extra, dispatch }) => {
    await extra.awardService.create(dto);
    await dispatch(fetchAwards());
  }
);
export const updateAward = createAsyncThunk(
  'awards/update',
  async ({ id, dto }, { extra, dispatch }) => {
    await extra.awardService.update(id, dto);
    await dispatch(fetchAwards());
  }
);
export const deleteAward = createAsyncThunk(
  'awards/delete',
  async (id, { extra, dispatch }) => {
    await extra.awardService.remove(id);
    await dispatch(fetchAwards());
  }
);

const slice = createSlice({
  name: 'awards',
  initialState: {
    items: [],
    totals: { count: 0, scholarshipAmounts: {} },
    loading: false,
    loaded: false,
    error: null,
    activeType: 'all',
    saving: false,
    saveError: null,
  },
  reducers: {
    setActiveType(state, { payload }) {
      state.activeType = payload;
    },
    clearSaveError(state) {
      state.saveError = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAwards.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchAwards.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.loaded = true;
        s.items = payload.items;
        s.totals = payload.totals;
      })
      .addCase(fetchAwards.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      });
    for (const t of [createAward, updateAward]) {
      b.addCase(t.pending, (s) => {
        s.saving = true;
        s.saveError = null;
      })
        .addCase(t.fulfilled, (s) => {
          s.saving = false;
        })
        .addCase(t.rejected, (s, { error }) => {
          s.saving = false;
          s.saveError = error.message;
        });
    }
    b.addCase(deleteAward.rejected, (s, { error }) => {
      s.error = error.message;
    });
  },
});

export const { setActiveType, clearSaveError: clearAwardSaveError } = slice.actions;
export default slice.reducer;
