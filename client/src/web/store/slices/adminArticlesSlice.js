import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAdminArticles = createAsyncThunk(
  'adminArticles/fetch',
  async (_arg, { extra }) => extra.articleService.listAll()
);

export const fetchAdminArticle = createAsyncThunk(
  'adminArticles/fetchOne',
  async (id, { extra }) => extra.articleService.getById(id)
);

/** Enregistre (création ou modification) puis, si demandé, publie et notifie. */
export const saveArticle = createAsyncThunk(
  'adminArticles/save',
  async ({ id, dto, publish = false }, { extra }) => {
    const saved = await extra.articleService.save(id, dto);
    if (publish && saved.status !== 'published')
      return extra.articleService.publish(saved.id);
    return saved;
  }
);

export const setArticlePublished = createAsyncThunk(
  'adminArticles/setPublished',
  async ({ id, published }, { extra }) =>
    published ? extra.articleService.publish(id) : extra.articleService.unpublish(id)
);

export const deleteArticle = createAsyncThunk(
  'adminArticles/delete',
  async (id, { extra }) => {
    await extra.articleService.remove(id);
    return id;
  }
);

const upsert = (items, item) => {
  // La liste n'affiche jamais le texte complet
  // eslint-disable-next-line no-unused-vars
  const { content, ...summary } = item;
  const i = items.findIndex((x) => x.id === item.id);
  if (i < 0) items.unshift(summary);
  else items[i] = { ...items[i], ...summary };
};

const slice = createSlice({
  name: 'adminArticles',
  initialState: {
    items: [],
    loading: false,
    error: null,
    current: null,
    currentLoading: false,
    saving: false,
    saveError: null,
  },
  reducers: {
    clearCurrentArticle(state) {
      state.current = null;
      state.saveError = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAdminArticles.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchAdminArticles.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = payload;
      })
      .addCase(fetchAdminArticles.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(fetchAdminArticle.pending, (s) => {
        s.currentLoading = true;
        s.saveError = null;
      })
      .addCase(fetchAdminArticle.fulfilled, (s, { payload }) => {
        s.currentLoading = false;
        s.current = payload;
      })
      .addCase(fetchAdminArticle.rejected, (s, { error }) => {
        s.currentLoading = false;
        s.saveError = error.message;
      })
      .addCase(saveArticle.pending, (s) => {
        s.saving = true;
        s.saveError = null;
      })
      .addCase(saveArticle.fulfilled, (s, { payload }) => {
        s.saving = false;
        s.current = payload;
        upsert(s.items, payload);
      })
      .addCase(saveArticle.rejected, (s, { error }) => {
        s.saving = false;
        s.saveError = error.message;
      })
      .addCase(setArticlePublished.fulfilled, (s, { payload }) => {
        upsert(s.items, payload);
        if (s.current && s.current.id === payload.id)
          s.current = { ...s.current, ...payload };
      })
      .addCase(setArticlePublished.rejected, (s, { error }) => {
        s.error = error.message;
      })
      .addCase(deleteArticle.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((x) => x.id !== payload);
      })
      .addCase(deleteArticle.rejected, (s, { error }) => {
        s.error = error.message;
      });
  },
});

export const { clearCurrentArticle } = slice.actions;
export default slice.reducer;
