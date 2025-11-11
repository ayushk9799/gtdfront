import { configureStore } from '@reduxjs/toolkit';
import progressReducer from './slices/progressSlice';
import currentGameReducer from './slices/currentGameSlice';
import dailyChallengeReducer from './slices/dailyChallengeSlice';
import userReducer from './slices/userSlice';
import categoriesReducer from './slices/categoriesSlice';
import leaderboardReducer from './slices/leaderboardSlice';

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    currentGame: currentGameReducer,
    dailyChallenge: dailyChallengeReducer,
    user: userReducer,
    categories: categoriesReducer,
    leaderboard: leaderboardReducer,
  },
});


