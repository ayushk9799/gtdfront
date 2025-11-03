import { configureStore } from '@reduxjs/toolkit';
import progressReducer from './slices/progressSlice';
import currentGameReducer from './slices/currentGameSlice';
import dailyChallengeReducer from './slices/dailyChallengeSlice';

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    currentGame: currentGameReducer,
    dailyChallenge: dailyChallengeReducer,
  },
});


