import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_arg, { extra }) => extra.adminContentService.dashboard()
);

const slice = createSlice({
  name: 'dashboard',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchDashboard.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.data = payload;
      })
      .addCase(fetchDashboard.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      });
  },
});

export default slice.reducer;
