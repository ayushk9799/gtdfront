import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

// Thunk: load today's daily challenge
export const loadTodaysChallenge = createAsyncThunk(
  'dailyChallenge/loadTodaysChallenge',
  async () => {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const res = await fetch(`${API_BASE}/api/daily-challenge/today?timezone=${encodeURIComponent(userTimezone)}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Failed to load today's challenge (${res.status})`);
    }
    const data = await res.json();
    return {
      challenge: data.challenge,
      userDate: data.userDate,
      timezone: data.timezone
    };
  }
);

// Thunk: load daily challenge by specific date
export const loadChallengeByDate = createAsyncThunk(
  'dailyChallenge/loadChallengeByDate',
  async (date) => {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const res = await fetch(`${API_BASE}/api/daily-challenge/${date}?timezone=${encodeURIComponent(userTimezone)}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Failed to load challenge for date ${date} (${res.status})`);
    }
    const data = await res.json();
    return {
      challenge: data.challenge,
      requestedDate: data.requestedDate,
      timezone: data.timezone
    };
  }
);

const initialState = {
  currentChallenge: null,
  challengeDate: null,
  userDate: null,
  timezone: null,
  status: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
  error: null,
  lastFetched: null,
};

const dailyChallengeSlice = createSlice({
  name: 'dailyChallenge',
  initialState,
  reducers: {
    clearDailyChallenge(state) {
      state.currentChallenge = null;
      state.challengeDate = null;
      state.userDate = null;
      state.timezone = null;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    setChallengeDate(state, action) {
      state.challengeDate = action.payload;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load today's challenge
      .addCase(loadTodaysChallenge.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadTodaysChallenge.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentChallenge = action.payload.challenge;
        state.challengeDate = action.payload.challenge?.date || null;
        state.userDate = action.payload.userDate;
        state.timezone = action.payload.timezone;
        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(loadTodaysChallenge.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load today\'s challenge';
        state.currentChallenge = null;
        state.challengeDate = null;
        state.userDate = null;
        state.timezone = null;
      })
      // Load challenge by date
      .addCase(loadChallengeByDate.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadChallengeByDate.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentChallenge = action.payload.challenge;
        state.challengeDate = action.payload.challenge?.date || null;
        state.userDate = action.payload.requestedDate;
        state.timezone = action.payload.timezone;
        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(loadChallengeByDate.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load challenge for the specified date';
        state.currentChallenge = null;
        state.challengeDate = null;
        state.userDate = null;
        state.timezone = null;
      });
  }
});

export const { clearDailyChallenge, setChallengeDate, clearError } = dailyChallengeSlice.actions;

// Selectors
export const selectCurrentChallenge = (state) => state.dailyChallenge.currentChallenge;
export const selectChallengeDate = (state) => state.dailyChallenge.challengeDate;
export const selectUserDate = (state) => state.dailyChallenge.userDate;
export const selectTimezone = (state) => state.dailyChallenge.timezone;
export const selectChallengeStatus = (state) => state.dailyChallenge.status;
export const selectChallengeError = (state) => state.dailyChallenge.error;
export const selectIsChallengeLoading = (state) => state.dailyChallenge.status === 'loading';
export const selectHasChallengeError = (state) => state.dailyChallenge.status === 'failed';

export default dailyChallengeSlice.reducer;
