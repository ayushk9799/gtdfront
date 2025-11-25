import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';
import { API_BASE } from '../../../constants/Api';

const storage = new MMKV();

const HEART_LEFT_KEY = 'HEART_LEFT';
const HEART_UPDATED_AT_KEY = 'HEART_UPDATED_AT';

export const getUser = createAsyncThunk(
  'user/getUser',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`);
      const data = await res.json();
      // console.log("data", data);
      
      if (!res.ok || data?.error) {
        const message = data?.error || 'User not found';
        return rejectWithValue(message);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userData }),
      });
      const data = await res.json();
      
      if (!res.ok || data?.error) {
        const message = data?.error || 'Failed to update user';
        return rejectWithValue(message);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);


const initialState = {
  userData: null,
  isPremium : false,
  customerInfo : null,
  hearts : 0,
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCustomerInfo: (state, action) => {
      state.isPremium = action.payload?.activeSubscriptions?.length > 0;
      if(state.isPremium) state.hearts = 100;
      state.customerInfo = action.payload || null;
    },
    setHearts: (state, action) => {
      const next = Number(action.payload);
      state.hearts = Number.isFinite(next) ? next : 0;
    },
    useHeart: (state) => {
        state.hearts = state.hearts - 1;
        storage.set(HEART_LEFT_KEY, state.hearts);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.userData = action.payload || null;
      })
      .addCase(getUser.rejected, (state) => {
        state.status = 'idle';
      })
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.userData = action.payload || null;
      })
      .addCase(updateUser.rejected, (state) => {
        state.status = 'idle';
      })
  },
});

export const refreshHearts = createAsyncThunk(
  'user/refreshHearts',
  async (_, { dispatch }) => {
    try {
      const now = new Date();
      const storedLeft = storage.getNumber(HEART_LEFT_KEY);
      const storedUpdatedAt = storage.getString(HEART_UPDATED_AT_KEY);

      let isNewDay = true;
      if (storedUpdatedAt) {
        const last = new Date(storedUpdatedAt);
        if (!Number.isNaN(last.getTime())) {
          isNewDay = now.toDateString() !== last.toDateString();
        }
      }

      let heartsLeft;
      if (isNewDay) {
        heartsLeft = 3;
        storage.set(HEART_LEFT_KEY, heartsLeft);
        storage.set(HEART_UPDATED_AT_KEY, now.toISOString());
      } else {
        const validStored = typeof storedLeft === 'number' && Number.isFinite(storedLeft);
        heartsLeft = validStored ? storedLeft : 3;
        // ensure keys exist if missing
        if (!validStored) storage.set(HEART_LEFT_KEY, heartsLeft);
        if (!storedUpdatedAt) storage.set(HEART_UPDATED_AT_KEY, now.toISOString());
      }

      dispatch(userSlice.actions.setHearts(heartsLeft));
      return heartsLeft;
    } catch (e) {
      const fallback = 3;
      try {
        storage.set(HEART_LEFT_KEY, fallback);
        storage.set(HEART_UPDATED_AT_KEY, new Date().toISOString());
      } catch {}
      dispatch(userSlice.actions.setHearts(fallback));
      return fallback;
    }
  }
);

export const { setCustomerInfo, setHearts, useHeart } = userSlice.actions;
export default userSlice.reducer;
