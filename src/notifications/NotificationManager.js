import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { updateUser } from '../store/slices/userSlice';

const storage = new MMKV();

export async function initializeAndroidNotifications(dispatch) {
  if (Platform.OS !== 'android') return () => {};
  try {
    const messaging = (await import('@react-native-firebase/messaging')).default;

    if (Number(Platform.Version) >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return () => {};
      }
    }

    await messaging().requestPermission();
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    const fcmToken = storage.getString('fcmToken');
    if (fcmToken !== token) {
      storage.set('fcmToken', token);
      console.log('FCM token', token);
      dispatch(updateUser({fcmToken : token}))
    }
    console.log('FCM token', token);

    try {
      await messaging().subscribeToTopic('ALL_USER');
    } catch (err) {
      console.warn('ALL_USER topic subscribe failed', err);
    }

    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message', remoteMessage);
      Alert.alert('Foreground message', JSON.stringify(remoteMessage));
    });

    const unsubscribeOnRefresh = messaging().onTokenRefresh(async newToken => {
      try {
        await messaging().subscribeToTopic('ALL_USER');
      } catch (err) {
        console.warn('ALL_USER topic re-subscribe failed', err);
      }
      // TODO: send newToken to backend
      storage.set('fcmToken', newToken);
      dispatch(updateUser({fcmToken : newToken}))
    });

    return () => {
      unsubscribeOnMessage && unsubscribeOnMessage();
      unsubscribeOnRefresh && unsubscribeOnRefresh();
    };
  } catch (e) {
    console.warn('Notification init failed', e);
    return () => {};
  }
}

export function registerAndroidBackgroundHandler() {
  if (Platform.OS !== 'android') return;
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // handle data-only background messages if needed
    });
  } catch (e) {
    // ignore if messaging not available
  }
}

// Register handlers to read data when user taps a notification
// Usage: provide callbacks to receive the remoteMessage.data payload
export async function registerAndroidNotificationTapHandlers({
  onBackgroundTap,
  onColdStartTap,
} = {}) {
  if (Platform.OS !== 'android') return () => {};
  try {
    const messaging = (await import('@react-native-firebase/messaging')).default;

    // When app is in background and opened by tapping a notification
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      try {
        const data = remoteMessage?.data || {};
        onBackgroundTap && onBackgroundTap(data, remoteMessage);
      } catch (err) {
        console.warn('onNotificationOpenedApp handler error', err);
      }
    });

    // When app is launched from a quit state by tapping a notification
    const checkInitial = async () => {
      try {
        const initial = await messaging().getInitialNotification();
        if (initial) {
          const data = initial?.data || {};
          onColdStartTap && onColdStartTap(data, initial);
        }
      } catch (err) {
        console.warn('getInitialNotification error', err);
      }
    };
    checkInitial();

    return () => {
      unsubscribeOpened && unsubscribeOpened();
    };
  } catch (e) {
    console.warn('registerAndroidNotificationTapHandlers failed', e);
    return () => {};
  }
}


