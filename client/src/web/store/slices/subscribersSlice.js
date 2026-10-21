import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSubscribers = createAsyncThunk(
  'subscribers/fetch',
  async (_arg, { extra }) => extra.subscriberAdminService.list()
);
export const removeNewsletterSubscriber = createAsyncThunk(
  'subscribers/removeNewsletter',
  async (id, { extra }) => {
    await extra.subscriberAdminService.removeNewsletter(id);
    return id;
  }
);
export const removePushSubscriber = createAsyncThunk(
  'subscribers/removePush',
  async (id, { extra }) => {
    await extra.subscriberAdminService.removePush(id);
    return id;
  }
);
export const sendTestEmail = createAsyncThunk(
  'subscribers/testEmail',
  async (to, { extra }) => {
    await extra.subscriberAdminService.sendTestEmail(to);
  }
);

const slice = createSlice({
  name: 'subscribers',
  initialState: {
    newsletter: [],
    push: [],
    loading: false,
    error: null,
    testStatus: 'idle',
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSubscribers.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchSubscribers.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.newsletter = payload.newsletter;
        s.push = payload.push;
      })
      .addCase(fetchSubscribers.rejected, (s, { error }) => {
        s.loading = false;
        s.error = error.message;
      })
      .addCase(removeNewsletterSubscriber.fulfilled, (s, { payload }) => {
        s.newsletter = s.newsletter.filter((x) => x.id !== payload);
      })
      .addCase(removePushSubscriber.fulfilled, (s, { payload }) => {
        s.push = s.push.filter((x) => x.id !== payload);
      })
      .addCase(sendTestEmail.pending, (s) => {
        s.testStatus = 'loading';
      })
      .addCase(sendTestEmail.fulfilled, (s) => {
        s.testStatus = 'sent';
      })
      .addCase(sendTestEmail.rejected, (s) => {
        s.testStatus = 'error';
      });
  },
});

export default slice.reducer;
