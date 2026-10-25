import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const sendContact = createAsyncThunk('contact/send', async (dto, { extra }) =>
  extra.contactService.send(dto)
);

const slice = createSlice({
  name: 'contact',
  // status : idle | loading | sent | error
  initialState: { status: 'idle', error: null, fields: {} },
  reducers: {
    resetContact(state) {
      state.status = 'idle';
      state.error = null;
      state.fields = {};
    },
  },
  extraReducers: (b) => {
    b.addCase(sendContact.pending, (s) => {
      s.status = 'loading';
      s.error = null;
      s.fields = {};
    })
      .addCase(sendContact.fulfilled, (s) => {
        s.status = 'sent';
      })
      .addCase(sendContact.rejected, (s, { error }) => {
        s.status = 'error';
        s.error = error.message;
      });
  },
});

export const { resetContact } = slice.actions;
export default slice.reducer;
