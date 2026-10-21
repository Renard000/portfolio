import { configureStore } from '@reduxjs/toolkit';
import articles from './slices/articlesSlice.js';
import certifications from './slices/certificationsSlice.js';
import awards from './slices/awardsSlice.js';
import newsletter from './slices/newsletterSlice.js';
import auth from './slices/authSlice.js';
import subscribers from './slices/subscribersSlice.js';

export function createStore(services) {
  return configureStore({
    reducer: { articles, certifications, awards, newsletter, auth, subscribers },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: services } }),
  });
}
