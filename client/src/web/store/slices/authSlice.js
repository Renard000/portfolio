import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_arg, { extra }) => {
    const session = await extra.authClient.getSession();
    return session ? { email: session.user.email } : null;
  }
);
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { extra }) => {
    const session = await extra.authClient.signIn(email, password);
    return { email: session.user.email };
  }
);
export const signOut = createAsyncThunk('auth/signOut', async (_arg, { extra }) => {
  await extra.authClient.signOut();
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, ready: false, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(restoreSession.fulfilled, (s, { payload }) => {
      s.user = payload;
      s.ready = true;
    })
      .addCase(restoreSession.rejected, (s) => {
        s.user = null;
        s.ready = true;
      })
      .addCase(signIn.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(signIn.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.user = payload;
      })
      .addCase(signIn.rejected, (s) => {
        s.loading = false;
        // Message volontairement vague : ne révèle pas si le compte existe.
        s.error = 'Identifiants invalides.';
      })
      .addCase(signOut.fulfilled, (s) => {
        s.user = null;
      });
  },
});

export default slice.reducer;
