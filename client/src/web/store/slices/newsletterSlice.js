import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const subscribeNewsletter = createAsyncThunk(
  'newsletter/subscribe',
  async (dto, { extra }) => extra.newsletterService.subscribe(dto)
);

export const enablePush = createAsyncThunk('push/enable', async (_arg, { extra }) =>
  extra.pushService.enable()
);

const slice = createSlice({
  name: 'newsletter',
  // status : idle | loading | pending (courriel de confirmation envoyé) | error
  initialState: { status: 'idle', error: null, push: 'idle' },
  reducers: {
    resetNewsletter(state) {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(subscribeNewsletter.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    })
      .addCase(subscribeNewsletter.fulfilled, (s) => {
        s.status = 'pending';
      })
      .addCase(subscribeNewsletter.rejected, (s, { error }) => {
        s.status = 'error';
        s.error = error.message;
      })
      .addCase(enablePush.pending, (s) => {
        s.push = 'loading';
      })
      .addCase(enablePush.fulfilled, (s, { payload }) => {
        s.push = payload; // 'subscribed' | 'unavailable'
      })
      .addCase(enablePush.rejected, (s) => {
        s.push = 'error';
      });
  },
});

export const { resetNewsletter } = slice.actions;
export default slice.reducer;
