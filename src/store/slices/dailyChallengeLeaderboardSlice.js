import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';
import { submitGameplay } from './currentGameSlice';

/**
 * Thunk: Fetch today's daily challenge leaderboard
 */
export const fetchTodayDailyLeaderboard = createAsyncThunk(
    'dailyChallengeLeaderboard/fetchToday',
    async ({ userId, timezone } = {}, { rejectWithValue }) => {
        try {
            const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            let url = `${API_BASE}/api/daily-challenge/leaderboard/today?timezone=${encodeURIComponent(userTimezone)}`;
            if (userId) {
                url += `&userId=${encodeURIComponent(userId)}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok || data?.error) {
                const message = data?.error || 'Failed to load daily challenge leaderboard';
                return rejectWithValue(message);
            }

            return data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

/**
 * Thunk: Fetch daily challenge leaderboard for a specific date
 */
export const fetchDailyLeaderboardByDate = createAsyncThunk(
    'dailyChallengeLeaderboard/fetchByDate',
    async ({ date, userId, timezone } = {}, { rejectWithValue }) => {
        try {
            if (!date) {
                return rejectWithValue('Date is required');
            }

            const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            let url = `${API_BASE}/api/daily-challenge/leaderboard/${date}?timezone=${encodeURIComponent(userTimezone)}`;
            if (userId) {
                url += `&userId=${encodeURIComponent(userId)}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok || data?.error) {
                const message = data?.error || 'Failed to load daily challenge leaderboard';
                return rejectWithValue(message);
            }

            return data;
        } catch (err) {
            return rejectWithValue(err?.message || 'Network error');
        }
    }
);

const initialState = {
    items: [],              // Top 10 players for the date
    me: null,               // Current user's position
    date: null,             // Challenge date (YYYY-MM-DD)
    challengeId: null,      // Challenge ID
    challengeTitle: '',     // Challenge title
    category: '',           // Challenge category
    totalParticipants: 0,   // Total number of participants
    status: 'idle',         // 'idle', 'loading', 'succeeded', 'failed'
    error: null,
};

const dailyChallengeLeaderboardSlice = createSlice({
    name: 'dailyChallengeLeaderboard',
    initialState,
    reducers: {
        clearDailyLeaderboard(state) {
            state.items = [];
            state.me = null;
            state.date = null;
            state.challengeId = null;
            state.challengeTitle = '';
            state.category = '';
            state.totalParticipants = 0;
            state.status = 'idle';
            state.error = null;
        },
        setDailyLeaderboardIdle(state) {
            state.status = 'idle';
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch today's leaderboard
            .addCase(fetchTodayDailyLeaderboard.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchTodayDailyLeaderboard.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload?.top10 || [];
                state.me = action.payload?.me || null;
                state.date = action.payload?.date || null;
                state.challengeId = action.payload?.challengeId || null;
                state.challengeTitle = action.payload?.challengeTitle || '';
                state.category = action.payload?.category || '';
                state.totalParticipants = action.payload?.totalParticipants || 0;
                state.error = null;
            })
            .addCase(fetchTodayDailyLeaderboard.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to load leaderboard';
                state.items = [];
                state.me = null;
            })
            // Fetch leaderboard by date
            .addCase(fetchDailyLeaderboardByDate.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDailyLeaderboardByDate.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload?.top10 || [];
                state.me = action.payload?.me || null;
                state.date = action.payload?.date || null;
                state.challengeId = action.payload?.challengeId || null;
                state.challengeTitle = action.payload?.challengeTitle || '';
                state.category = action.payload?.category || '';
                state.totalParticipants = action.payload?.totalParticipants || 0;
                state.error = null;
            })
            .addCase(fetchDailyLeaderboardByDate.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || 'Failed to load leaderboard';
                state.items = [];
                state.me = null;
            })
            // Reset status to idle when a daily challenge is submitted
            .addCase(submitGameplay.fulfilled, (state, action) => {
                if (action.payload?.sourceType === 'dailyChallenge') {
                    state.status = 'idle';
                }
            });
    },
});

export const { clearDailyLeaderboard, clearError, setDailyLeaderboardIdle } = dailyChallengeLeaderboardSlice.actions;

// Selectors
export const selectDailyLeaderboardItems = (state) => state.dailyChallengeLeaderboard.items;
export const selectDailyLeaderboardMe = (state) => state.dailyChallengeLeaderboard.me;
export const selectDailyLeaderboardDate = (state) => state.dailyChallengeLeaderboard.date;
export const selectDailyLeaderboardChallengeTitle = (state) => state.dailyChallengeLeaderboard.challengeTitle;
export const selectDailyLeaderboardCategory = (state) => state.dailyChallengeLeaderboard.category;
export const selectDailyLeaderboardTotalParticipants = (state) => state.dailyChallengeLeaderboard.totalParticipants;
export const selectDailyLeaderboardStatus = (state) => state.dailyChallengeLeaderboard.status;
export const selectDailyLeaderboardError = (state) => state.dailyChallengeLeaderboard.error;
export const selectIsDailyLeaderboardLoading = (state) => state.dailyChallengeLeaderboard.status === 'loading';

export default dailyChallengeLeaderboardSlice.reducer;
