import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getApiErrorMessage } from '../../services/api';
import { getCurrentPartner, loginPartner as loginRequest, logoutPartner as logoutRequest, registerPartner as registerRequest, toPartnerProfile } from '../../services/authService';

export const restorePartnerSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try { return await getCurrentPartner(); }
  catch (error) { return rejectWithValue(error.response?.status === 401 ? null : getApiErrorMessage(error)); }
});

export const signInPartner = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    await loginRequest(credentials);
    return await getCurrentPartner();
  } catch (error) { return rejectWithValue(getApiErrorMessage(error, 'Those details don’t match our records. Please try again.')); }
});

export const createPartnerAccount = createAsyncThunk('auth/register', async (registration, { rejectWithValue }) => {
  try { return await registerRequest(registration); }
  catch (error) { return rejectWithValue(getApiErrorMessage(error)); }
});

export const signOutPartner = createAsyncThunk('auth/logout', async () => {
  try { return await logoutRequest(); } catch (_) { return null; }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, partner: null, isAuthenticated: false, isLoading: false, initialized: false, error: null, notice: '' },
  reducers: {
    setError(state, action) { state.error = action.payload || null; },
    expireSession(state) {
      state.user = null; state.partner = null; state.isAuthenticated = false; state.isLoading = false;
      state.initialized = true; state.error = null; state.notice = 'Your session has expired. Please log in again.';
    },
    clearNotice(state) { state.notice = ''; },
  },
  extraReducers(builder) {
    builder
      .addCase(restorePartnerSession.pending, (state) => { state.isLoading = true; })
      .addCase(restorePartnerSession.fulfilled, (state, action) => {
        state.user = action.payload; state.partner = toPartnerProfile(action.payload); state.isAuthenticated = action.payload?.role === 'PARTNER';
        if (!state.isAuthenticated) { state.user = null; state.partner = null; }
        state.isLoading = false; state.initialized = true; state.error = null;
      })
      .addCase(restorePartnerSession.rejected, (state, action) => {
        state.user = null; state.partner = null; state.isAuthenticated = false; state.isLoading = false; state.initialized = true;
        state.error = typeof action.payload === 'string' ? action.payload : null;
      })
      .addCase(signInPartner.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(signInPartner.fulfilled, (state, action) => {
        state.user = action.payload; state.partner = toPartnerProfile(action.payload); state.isAuthenticated = action.payload.role === 'PARTNER';
        state.isLoading = false; state.initialized = true; state.error = null;
      })
      .addCase(signInPartner.rejected, (state, action) => { state.isLoading = false; state.isAuthenticated = false; state.error = action.payload || 'Unable to sign in.'; })
      .addCase(createPartnerAccount.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createPartnerAccount.fulfilled, (state) => { state.isLoading = false; state.error = null; })
      .addCase(createPartnerAccount.rejected, (state, action) => { state.isLoading = false; state.error = action.payload || 'Unable to create your account.'; })
      .addCase(signOutPartner.fulfilled, (state) => {
        state.user = null; state.partner = null; state.isAuthenticated = false; state.isLoading = false; state.initialized = true; state.error = null;
      });
  },
});

export const { setError, expireSession, clearNotice } = authSlice.actions;
export default authSlice.reducer;
