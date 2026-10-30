import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadContent } from './contentSlice.js';

export const fetchAdminProjects = createAsyncThunk(
  'adminPortfolio/fetchProjects',
  async (_arg, { extra }) => extra.portfolioAdminService.listProjects()
);
export const fetchAdminSkills = createAsyncThunk(
  'adminPortfolio/fetchSkills',
  async (_arg, { extra }) => extra.portfolioAdminService.listSkills()
);

/** Après chaque écriture, le contenu du site public est rechargé depuis l'API. */
const refreshSite = (dispatch) => dispatch(loadContent());

export const saveProject = createAsyncThunk(
  'adminPortfolio/saveProject',
  async ({ id, dto }, { extra, dispatch }) => {
    const saved = await extra.portfolioAdminService.saveProject(id, dto);
    refreshSite(dispatch);
    return saved;
  }
);
export const deleteProject = createAsyncThunk(
  'adminPortfolio/deleteProject',
  async (id, { extra, dispatch }) => {
    await extra.portfolioAdminService.removeProject(id);
    refreshSite(dispatch);
    return id;
  }
);
export const saveSkill = createAsyncThunk(
  'adminPortfolio/saveSkill',
  async ({ id, dto }, { extra, dispatch }) => {
    const saved = await extra.portfolioAdminService.saveSkill(id, dto);
    refreshSite(dispatch);
    return saved;
  }
);
export const deleteSkill = createAsyncThunk(
  'adminPortfolio/deleteSkill',
  async (id, { extra, dispatch }) => {
    await extra.portfolioAdminService.removeSkill(id);
    refreshSite(dispatch);
    return id;
  }
);

const upsert = (list, item) => {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) list.push(item);
  else list[i] = item;
};

const slice = createSlice({
  name: 'adminPortfolio',
  initialState: { projects: [], skills: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    for (const [thunk, key] of [
      [fetchAdminProjects, 'projects'],
      [fetchAdminSkills, 'skills'],
    ]) {
      b.addCase(thunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s, { payload }) => {
          s.loading = false;
          s[key] = payload;
        })
        .addCase(thunk.rejected, (s, { error }) => {
          s.loading = false;
          s.error = error.message;
        });
    }
    b.addCase(saveProject.fulfilled, (s, { payload }) => upsert(s.projects, payload))
      .addCase(deleteProject.fulfilled, (s, { payload }) => {
        s.projects = s.projects.filter((p) => p.id !== payload);
      })
      .addCase(saveSkill.fulfilled, (s, { payload }) => upsert(s.skills, payload))
      .addCase(deleteSkill.fulfilled, (s, { payload }) => {
        s.skills = s.skills.filter((p) => p.id !== payload);
      });
    for (const t of [deleteProject, deleteSkill])
      b.addCase(t.rejected, (s, { error }) => {
        s.error = error.message;
      });
  },
});

export default slice.reducer;
