import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';
import { API_BASE } from '../../../constants/Api';
import { Platform } from 'react-native';

const storage = new MMKV();

export const loadUserFromStorage = createAsyncThunk(
  'user/loadUserFromStorage',
  async () => {
    try {
      const stored = storage.getString('user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed || null;
    } catch (_) {
      return null;
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'user/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/login/google/loginSignUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken, platfrom: Platform.OS === 'android' ? 'android' : 'ios' })
      });
      const data = await res.json();
      if (!res.ok || data?.success !== true) {
        const message = data?.error || 'Login failed';
        return rejectWithValue(message);
      }
      const user = data.user || null;
      if (user) storage.set('user', JSON.stringify(user));
      return user;
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);

export const logout = createAsyncThunk('user/logout', async () => {
  try {
    storage.delete('user');
  } catch (_) {}
  return true;
});

const initialState = {
  user: null,
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload || null;
      state.error = null;
      try {
        if (action.payload) storage.set('user', JSON.stringify(action.payload));
      } catch (_) {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload || null;
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.status = 'idle';
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload || null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload || action.error?.message || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
