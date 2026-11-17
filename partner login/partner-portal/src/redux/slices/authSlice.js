import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { partner: null, isAuthenticated: false },
  reducers: {
    setPartner(state, action) { state.partner = action.payload; state.isAuthenticated = true; },
    clearPartner(state) { state.partner = null; state.isAuthenticated = false; },
  },
});

export const { setPartner, clearPartner } = authSlice.actions;
export default authSlice.reducer;
