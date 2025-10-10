import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

export const fetchDepartmentProgress = createAsyncThunk(
  'progress/fetchDepartmentProgress',
  async (userId) => {
    const res = await fetch(`${API_BASE}/api/users/${userId}/progress/department?limit=2`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch progress (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.departments) ? data.departments : [];
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState: { status: 'idle', items: [], error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartmentProgress.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDepartmentProgress.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDepartmentProgress.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to fetch progress';
      });
  },
});

export default progressSlice.reducer;


