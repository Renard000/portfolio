import { configureStore } from '@reduxjs/toolkit';
import articles from './slices/articlesSlice.js';

export function createStore(services) {
  return configureStore({
    reducer: { articles /*, projects, auth, ui, notifications */ },
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: services } }),
  });
}