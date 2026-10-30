import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/** Liste du blog (filtres catégorie, recherche, page). */
export const fetchArticles = createAsyncThunk(
  'articles/fetchList',
  async (params, { extra }) => extra.articleService.list(params)
);

/** Trois derniers articles pour l'accueil (n'affecte ni les filtres ni la liste du blog). */
export const fetchLatestArticles = createAsyncThunk(
  'articles/fetchLatest',
  async (_arg, { extra }) => (await extra.articleService.list({ limit: 3 })).items
);

/** Détail d'un article ; la vue est comptée sans bloquer l'affichage. */
export const fetchArticle = createAsyncThunk(
  'articles/fetchOne',
  async (slug, { extra }) => {
    const data = await extra.articleService.get(slug);
    extra.articleService.view(data.article.id).catch(() => {});
    return data;
  }
);

export const likeArticle = createAsyncThunk('articles/like', async (id, { extra }) =>
  extra.articleService.like(id)
);

export const postComment = createAsyncThunk(
  'articles/comment',
  async ({ id, ...dto }, { extra }) => extra.articleService.comment(id, dto)
);

const slice = createSlice({
  name: 'articles',
  initialState: {
    items: [],
    latest: [],
    total: 0,
    page: 1,
    pages: 1,
    categories: [],
    loading: false,
    error: null,
    filters: { category: 'all', q: '', page: 1 },
    current: null,
    currentLoading: false,
    currentError: null,
    liked: false,
    // idle | loading | pending (en attente de modération) | error
    commentStatus: 'idle',
    commentError: null,
  },
  reducers: {
    setArticleFilter(state, { payload }) {
      // Changer de catégorie ou de recherche ramène à la première page
      state.filters = { ...state.filters, page: 1, ...payload };
    },
    resetComment(state) {
      state.commentStatus = 'idle';
      state.commentError = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchArticles.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchArticles.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.items = payload.items;
        s.total = payload.total;
        s.page = payload.page;
        s.pages = payload.pages;
        s.categories = payload.categories;
      })
      .addCase(fetchArticles.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(fetchLatestArticles.fulfilled, (s, { payload }) => {
        s.latest = payload;
      })
      .addCase(fetchArticle.pending, (s) => {
        s.currentLoading = true;
        s.currentError = null;
        s.liked = false;
        s.commentStatus = 'idle';
        s.commentError = null;
      })
      .addCase(fetchArticle.fulfilled, (s, { payload }) => {
        s.currentLoading = false;
        s.current = payload;
      })
      .addCase(fetchArticle.rejected, (s, { error }) => {
        s.currentLoading = false;
        s.current = null;
        s.currentError = error.message;
      })
      .addCase(likeArticle.fulfilled, (s, { payload }) => {
        s.liked = true;
        if (s.current) s.current.article.likes = payload;
      })
      .addCase(postComment.pending, (s) => {
        s.commentStatus = 'loading';
        s.commentError = null;
      })
      .addCase(postComment.fulfilled, (s) => {
        s.commentStatus = 'pending';
      })
      .addCase(postComment.rejected, (s, { error }) => {
        s.commentStatus = 'error';
        s.commentError = error.message;
      });
  },
});

export const { setArticleFilter, resetComment } = slice.actions;
export default slice.reducer;
