import { getAnalytics, logEvent, logScreenView, setUserId } from '@react-native-firebase/analytics';

const analytics = getAnalytics();

const sanitizeParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => (
      value !== undefined
      && value !== null
      && ['string', 'number', 'boolean'].includes(typeof value)
    )),
  );
};

export const identifyAnalyticsUser = async (userId) => {
  try {
    await setUserId(analytics, userId ? String(userId) : null);
  } catch (error) {
    if (__DEV__) console.warn('Failed to set analytics user id', error);
  }
};

export const trackScreen = async (screenName) => {
  if (!screenName) return;

  try {
    await logScreenView(analytics, {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    if (__DEV__) console.warn('Failed to log screen view', error);
  }
};

export const trackEvent = async (eventName, params = {}) => {
  if (!eventName) return;

  try {
    await logEvent(analytics, eventName, sanitizeParams(params));
  } catch (error) {
    if (__DEV__) console.warn('Failed to log analytics event', error);
  }
};
