import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';
import { API_BASE } from '../../../constants/Api';
import { Platform } from 'react-native';

const storage = new MMKV();

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
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCustomerInfo: (state, action) => {
      state.isPremium = action.payload?.activeSubscriptions?.length > 0;
      state.customerInfo = action.payload || null;
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

export const { setCustomerInfo } = userSlice.actions;
export default userSlice.reducer;
