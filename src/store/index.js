import { configureStore } from '@reduxjs/toolkit';
import progressReducer from './slices/progressSlice';
import currentGameReducer from './slices/currentGameSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    currentGame: currentGameReducer,
    user: userReducer,
  },
});


