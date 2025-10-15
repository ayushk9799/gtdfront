import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load categories (${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.categories) ? data.categories : [];
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { status: 'idle', items: [], error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load categories';
      });
  },
});

export default categoriesSlice.reducer;
