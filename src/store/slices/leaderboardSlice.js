import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

export const fetchTop10 = createAsyncThunk(
  'leaderboard/fetchTop10',
  async (userId, { rejectWithValue }) => {
    try {
      const url = userId
        ? `${API_BASE}/api/leaderboard/top10?userId=${encodeURIComponent(userId)}`
        : `${API_BASE}/api/leaderboard/top10`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data?.error) {
        const message = data?.error || 'Failed to load leaderboard';
        return rejectWithValue(message);
      }
      return { items: data?.top10 || [], me: data?.me || null };
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);

const initialState = {
  items: [],
  me: null,
  status: 'idle',
  error: null,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTop10.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTop10.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
        state.me = action.payload?.me || null;
      })
      .addCase(fetchTop10.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload || 'Failed to load leaderboard';
      });
  },
});

export default leaderboardSlice.reducer;


