import { createAsyncThunk } from '@reduxjs/toolkit';

/** Envoie une image ou un PDF dans Supabase Storage ; renvoie l'URL publique. */
export const uploadAsset = createAsyncThunk(
  'uploads/asset',
  async ({ file, kind, folder }, { extra }) =>
    extra.uploadService.upload(file, kind, folder)
);
