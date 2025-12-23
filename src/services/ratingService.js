/**
 * Rating Service
 * Handles in-app review prompts for iOS and Android
 * Triggers after the first case is completed
 */
import { MMKV } from 'react-native-mmkv';
import InAppReview from 'react-native-in-app-review';

const storage = new MMKV();

const GAMES_PLAYED_KEY = 'GAMES_PLAYED_COUNT';
const HAS_REQUESTED_REVIEW_KEY = 'HAS_REQUESTED_REVIEW';

/**
 * Get the number of games/cases the user has completed
 */
export const getGamesPlayedCount = () => {
  const count = storage.getNumber(GAMES_PLAYED_KEY);
  return typeof count === 'number' && Number.isFinite(count) ? count : 0;
};

/**
 * Increment the games played count
 */
export const incrementGamesPlayed = () => {
  const current = getGamesPlayedCount();
  const newCount = current + 1;
  storage.set(GAMES_PLAYED_KEY, newCount);
  return newCount;
};

/**
 * Check if we've already requested a review
 */
export const hasRequestedReview = () => {
  return storage.getBoolean(HAS_REQUESTED_REVIEW_KEY) === true;
};

/**
 * Mark that we've requested a review
 */
export const setReviewRequested = () => {
  storage.set(HAS_REQUESTED_REVIEW_KEY, true);
};

/**
 * Check if the device supports in-app review
 */
export const isReviewAvailable = () => {
  return InAppReview.isAvailable();
};

/**
 * Request the in-app review prompt
 * This will only work if:
 * 1. The device supports in-app review (iOS 10.3+ / Android 5.0+)
 * 2. The store allows showing the dialog (quotas apply on Android)
 * 
 * Note: On iOS, the review dialog may not always appear due to Apple's quotas
 * Note: On Android, the review dialog may not appear if the user has recently reviewed
 */
export const requestInAppReview = async () => {
  try {
    // Check if in-app review is available on this device
    if (!InAppReview.isAvailable()) {
      console.log('📱 In-app review not available on this device');
      return false;
    }

    // Request the review
    const hasFlowFinished = await InAppReview.RequestInAppReview();
    console.log('📱 In-app review flow finished:', hasFlowFinished);

    // Mark that we've attempted to show the review
    setReviewRequested();

    return hasFlowFinished;
  } catch (error) {
    console.log('📱 In-app review error:', error);
    return false;
  }
};

/**
 * Main function to call after completing a game/case
 * Will request review only after the first game and if not already requested
 * 
 * @returns {Promise<boolean>} True if review was shown, false otherwise
 */
export const checkAndRequestReview = async () => {
  // Increment games played
  const gamesPlayed = incrementGamesPlayed();

  console.log(`📱 Games played count: ${gamesPlayed}`);

  // Only show review after the first game (gamesPlayed === 1)
  // and if we haven't already requested a review
  if (gamesPlayed === 1 && !hasRequestedReview()) {
    console.log('📱 First game completed! Requesting in-app review...');

    // Add a small delay to let the user see their results first
    await new Promise(resolve => setTimeout(resolve, 1500));

    return await requestInAppReview();
  }

  return false;
};

/**
 * Reset rating service state (for testing purposes)
 */
export const resetRatingState = () => {
  storage.delete(GAMES_PLAYED_KEY);
  storage.delete(HAS_REQUESTED_REVIEW_KEY);
};

