import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';
import { submitGameplay } from './currentGameSlice';

export const getUser = createAsyncThunk(
  'user/getUser',
  async (userId, { rejectWithValue }) => {
    try {
      // Get device timezone to send to server
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

// Async thunk to use a heart (calls server API)
export const useHeart = createAsyncThunk(
  'user/useHeart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userData } = getState().user;
      const userId = userData?._id;
      if (!userId) return rejectWithValue('No user ID');

      const res = await fetch(`${API_BASE}/api/users/${userId}/hearts/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) return rejectWithValue(data?.error || 'Failed to use heart');
      return data.hearts;
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  }
);


const initialState = {
  userData: null,
  isPremium: false,
  customerInfo: null,
  hearts: 0,
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
      if (state.isPremium) state.hearts = 100;
      state.customerInfo = action.payload || null;
    },
    setHearts: (state, action) => {
      const next = Number(action.payload);
      state.hearts = Number.isFinite(next) ? next : 0;
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
        // Set hearts from server response
        state.hearts = action.payload?.hearts ?? 0;
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
        // For premium users, keep hearts at 100 (unlimited); otherwise use server response
        if (state.isPremium) {
          state.hearts = 100;
        } else {
          state.hearts = action.payload?.hearts ?? 0;
        }
      })
      .addCase(updateUser.rejected, (state) => {
        state.status = 'idle';
      })
      // Handle useHeart async thunk
      .addCase(useHeart.fulfilled, (state, action) => {
        state.hearts = action.payload;
      })
      // Update user data when gameplay is submitted successfully
      .addCase(submitGameplay.fulfilled, (state, action) => {
        const updatedUser = action.payload?.updatedUser;
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

export const { setCustomerInfo, setHearts } = userSlice.actions;
export default userSlice.reducer;
