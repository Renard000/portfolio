import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const loadContent = createAsyncThunk('content/load', async (_arg, { extra }) =>
  extra.contentService.getAll()
);

const slice = createSlice({
  name: 'content',
  initialState: {
    profile: null,
    projects: [],
    locale: 'fr-CA',
    loaded: false,
    filters: { category: 'all', q: '' },
  },
  reducers: {
    setProjectFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
  },
  extraReducers: (b) => {
    b.addCase(loadContent.fulfilled, (s, { payload }) => {
      s.profile = payload.profile;
      s.projects = payload.projects;
      s.loaded = true;
    });
  },
});

export const { setProjectFilter } = slice.actions;

/** Change la langue du site ; la page se recharge dans la nouvelle langue. */
export const toggleLanguage = () => (dispatch, getState, extra) =>
  extra.localeService.toggle();

export default slice.reducer;
