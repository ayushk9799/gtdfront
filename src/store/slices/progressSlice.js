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

export const fetchCategoryCases = createAsyncThunk(
  'progress/fetchCategoryCases',
  async ({ userId, categoryId }) => {
    const res = await fetch(`${API_BASE}/api/users/${userId}/progress/department?categoryId=${categoryId}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to fetch department cases (${res.status})`);
    }
    const data = await res.json();
    // When categoryId is provided, the backend returns an array with one department containing the 'cases' array
    return (Array.isArray(data?.departments) && data.departments.length > 0) ? data.departments[0] : null;
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState: { status: 'idle', items: [], departmentCases: null, departmentCasesStatus: 'idle', error: null },
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
      })
      .addCase(fetchCategoryCases.pending, (state) => {
        state.departmentCasesStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchCategoryCases.fulfilled, (state, action) => {
        state.departmentCasesStatus = 'succeeded';
        state.departmentCases = action.payload;
      })
      .addCase(fetchCategoryCases.rejected, (state, action) => {
        state.departmentCasesStatus = 'failed';
        state.error = action.error?.message || 'Failed to fetch department cases';
      });
  },
});

export default progressSlice.reducer;


