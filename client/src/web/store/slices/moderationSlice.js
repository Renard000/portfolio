import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { alertUser } from './feedSlice.js';
import { fetchSubscribers } from './subscribersSlice.js';

export const fetchComments = createAsyncThunk(
  'moderation/fetchComments',
  async (_arg, { extra }) => extra.adminContentService.listComments()
);
export const moderateComment = createAsyncThunk(
  'moderation/moderateComment',
  async ({ id, approved }, { extra }) =>
    extra.adminContentService.moderateComment(id, approved)
);
export const removeComment = createAsyncThunk(
  'moderation/removeComment',
  async (id, { extra }) => {
    await extra.adminContentService.removeComment(id);
    return id;
  }
);

export const fetchMessages = createAsyncThunk(
  'moderation/fetchMessages',
  async (_arg, { extra }) => extra.adminContentService.listMessages()
);
export const markMessage = createAsyncThunk(
  'moderation/markMessage',
  async ({ id, lu }, { extra }) => extra.adminContentService.markMessage(id, lu)
);
export const removeMessage = createAsyncThunk(
  'moderation/removeMessage',
  async (id, { extra }) => {
    await extra.adminContentService.removeMessage(id);
    return id;
  }
);

/** Envoie la réponse depuis l'admin ; le message passe en lu et répondu. */
export const replyToMessage = createAsyncThunk(
  'moderation/reply',
  async ({ id, dto }, { extra }) => extra.emailAdminService.reply(id, dto)
);
export const fetchReplyDraft = createAsyncThunk(
  'moderation/replyDraft',
  async (id, { extra }) => extra.emailAdminService.replyDraft(id)
);

/** Alertes de l'admin en temps réel ; renvoie la fonction de désabonnement. */
export const subscribeAdminAlerts = () => (dispatch, getState, extra) =>
  extra.adminAlertService.subscribe((table, alert) => {
    dispatch(alertUser(alert));
    if (table === 'messages') dispatch(fetchMessages());
    if (table === 'comments') dispatch(fetchComments());
    if (table === 'subscribers') dispatch(fetchSubscribers());
  });

const replace = (list, item) =>
  list.map((x) => (x.id === item.id ? { ...x, ...item } : x));

const slice = createSlice({
  name: 'moderation',
  initialState: {
    comments: [],
    messages: [],
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    const pending = (s) => {
      s.loading = true;
      s.error = null;
    };
    const rejected = (s, { error }) => {
      s.loading = false;
      s.error = error.message;
    };
    b.addCase(fetchComments.pending, pending)
      .addCase(fetchComments.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.loaded = true;
        s.comments = payload;
      })
      .addCase(fetchComments.rejected, rejected)
      .addCase(fetchMessages.pending, pending)
      .addCase(fetchMessages.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.loaded = true;
        s.messages = payload;
      })
      .addCase(fetchMessages.rejected, rejected)
      .addCase(moderateComment.fulfilled, (s, { payload }) => {
        s.comments = replace(s.comments, payload);
      })
      .addCase(removeComment.fulfilled, (s, { payload }) => {
        s.comments = s.comments.filter((c) => c.id !== payload);
      })
      .addCase(markMessage.fulfilled, (s, { payload }) => {
        s.messages = replace(s.messages, payload);
      })
      .addCase(replyToMessage.fulfilled, (s, { payload }) => {
        s.messages = replace(s.messages, payload);
      })
      .addCase(removeMessage.fulfilled, (s, { payload }) => {
        s.messages = s.messages.filter((m) => m.id !== payload);
      });
    for (const t of [moderateComment, removeComment, markMessage, removeMessage])
      b.addCase(t.rejected, (s, { error }) => {
        s.error = error.message;
      });
  },
});

export default slice.reducer;
