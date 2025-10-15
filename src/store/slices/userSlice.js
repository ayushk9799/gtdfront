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
      console.log("data", data);
      
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
  async (userId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`);
      const data = await res.json();
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);

const initialState = {
  userData: null,
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
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

export default userSlice.reducer;
