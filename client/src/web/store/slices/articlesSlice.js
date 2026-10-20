import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 1. Votre action asynchrone (thunk)
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async ({ page }) => {
    // Votre appel API ici
    const response = await fetch(`/api/articles?page=${page}`);
    return await response.json();
  }
);

// 2. Le slice
const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// 3. EXPORT IMPORTANT : Exporter le reducer par défaut pour le store
export default articlesSlice.reducer;