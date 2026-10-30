import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import FeedService from '../../../bll/services/FeedService.js';

const DURATION = 8000;
let nextToast = 0;

export const fetchFeed = createAsyncThunk('feed/fetch', async (_arg, { extra }) => ({
  items: await extra.feedService.list(),
  seen: extra.feedService.loadSeen(),
}));

const slice = createSlice({
  name: 'feed',
  initialState: {
    items: [],
    loaded: false,
    seen: { items: {}, sections: {}, muted: false },
    toasts: [],
  },
  reducers: {
    publicationReceived(state, { payload }) {
      if (!state.items.some((i) => i.id === payload.id)) state.items.unshift(payload);
    },
    seenChanged(state, { payload }) {
      state.seen = payload;
    },
    toastAdded(state, { payload }) {
      state.toasts.push(payload);
    },
    toastDismissed(state, { payload }) {
      state.toasts = state.toasts.filter((t) => t.id !== payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchFeed.fulfilled, (s, { payload }) => {
      s.items = payload.items;
      s.seen = payload.seen;
      s.loaded = true;
    }).addCase(fetchFeed.rejected, (s) => {
      s.loaded = true;
    });
  },
});

export const { publicationReceived, toastDismissed } = slice.actions;
const { seenChanged, toastAdded } = slice.actions;

const persist = (seen) => (dispatch, getState, extra) => {
  if (seen === getState().feed.seen) return;
  dispatch(seenChanged(seen));
  extra.feedService.saveSeen(seen);
};

/** Affiche une alerte et joue le son, sauf si le visiteur l'a coupé. */
export const alertUser = (toast) => (dispatch, getState, extra) => {
  const id = `toast-${(nextToast += 1)}`;
  dispatch(toastAdded({ ...toast, id, duration: DURATION }));
  if (!getState().feed.seen.muted) extra.soundClient.play();
};

/** Temps réel ; renvoie la fonction de désabonnement. */
export const subscribeFeed = (onPublication) => (dispatch, getState, extra) =>
  extra.feedService.subscribe((item) => {
    dispatch(publicationReceived(item));
    onPublication(item);
  });

export const visitPath = (pathname) => (dispatch, getState) => {
  const { seen, items } = getState().feed;
  dispatch(persist(FeedService.visit(seen, items, pathname)));
};

/** Publication sans page propre (certification, distinction) ouverte en modal. */
export const markPublicationSeen = (key) => (dispatch, getState) => {
  const { seen, items } = getState().feed;
  const opened = items.filter((i) => `${i.kind}:${i.refId}` === key);
  dispatch(persist(FeedService.markSeen(seen, opened)));
};

export const toggleMuted = () => (dispatch, getState) => {
  const { seen } = getState().feed;
  dispatch(persist({ ...seen, muted: !seen.muted }));
};

export default slice.reducer;
