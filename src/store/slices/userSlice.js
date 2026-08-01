import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';
import { submitGameplay } from './currentGameSlice';

export const getUser = createAsyncThunk(
  'user/getUser',
  async (userId, { rejectWithValue }) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`${API_BASE}/api/users/${userId}?timezone=${encodeURIComponent(timezone)}`);
      const data = await res.json();

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
  isPremium: false,
  customerInfo: null,
  status: 'idle',
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCustomerInfo: (state, action) => {
      // Check both activeSubscriptions (for weekly/monthly) AND entitlements.active (for lifetime purchases)
      const hasActiveSubscription = action.payload?.activeSubscriptions?.length > 0;
      const hasActiveEntitlement = Object.keys(action.payload?.entitlements?.active || {}).length > 0;
      state.isPremium = hasActiveSubscription || hasActiveEntitlement;
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
      // Update user data when gameplay is submitted successfully
      .addCase(submitGameplay.fulfilled, (state, action) => {
        const { updatedUser, isReattempt } = action.payload || {};
        
        // Skip updates if this was a reattempt (original score stands)
        if (isReattempt) return;

        if (updatedUser && state.userData) {
          // Update cumulative points
          if (updatedUser.cumulativePoints) {
            state.userData.cumulativePoints = updatedUser.cumulativePoints;
          }
          // Update completedCases array length by creating placeholder entries
          if (typeof updatedUser.completedCasesCount === 'number') {
            const currentCount = (state.userData.completedCases || []).length;
            if (updatedUser.completedCasesCount > currentCount) {
              // Add placeholder entries to match the count
              state.userData.completedCases = state.userData.completedCases || [];
              while (state.userData.completedCases.length < updatedUser.completedCasesCount) {
                state.userData.completedCases.push({});
              }
            }
          }
          // Update completedDailyChallenges array length
          if (typeof updatedUser.completedDailyChallengesCount === 'number') {
            const currentCount = (state.userData.completedDailyChallenges || []).length;
            if (updatedUser.completedDailyChallengesCount > currentCount) {
              state.userData.completedDailyChallenges = state.userData.completedDailyChallenges || [];
              while (state.userData.completedDailyChallenges.length < updatedUser.completedDailyChallengesCount) {
                state.userData.completedDailyChallenges.push({});
              }
            }
          }
        }
      });
  },
});

export const { setCustomerInfo } = userSlice.actions;
export default userSlice.reducer;
