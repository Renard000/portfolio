import { configureStore } from '@reduxjs/toolkit';
import articles from './slices/articlesSlice.js';
import certifications from './slices/certificationsSlice.js';
import awards from './slices/awardsSlice.js';
import newsletter from './slices/newsletterSlice.js';
import auth from './slices/authSlice.js';
import subscribers from './slices/subscribersSlice.js';
import content from './slices/contentSlice.js';
import contact from './slices/contactSlice.js';
import videos from './slices/videosSlice.js';
import adminVideos from './slices/adminVideosSlice.js';
import progress from './slices/progressSlice.js';

export function createStore(services) {
  // Le contenu éditable (profil, projets) est local : on préremplit le store.
  const snapshot = services.contentService ? services.contentService.snapshot() : null;
  return configureStore({
    preloadedState: snapshot
      ? { content: { ...snapshot, loaded: true, filters: { category: 'all', q: '' } } }
      : undefined,
    reducer: {
      articles,
      certifications,
      awards,
      newsletter,
      auth,
      subscribers,
      content,
      contact,
      videos,
      adminVideos,
      progress,
    },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: services } }),
  });
}
