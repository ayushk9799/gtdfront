/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, useColorScheme, View, Platform, PermissionsAndroid, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Login from './src/Login';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from './constants/Colors';
import ClinicalInfo from './src/ClinicalInfo';
import HomeScreen from './src/screens/HomeScreen';
import LearningScreen from './src/screens/LearningScreen';
import LeagueScreen from './src/screens/LeagueScreen';
import AccountScreen from './src/screens/AccountScreen';
import ClinicalInsight from './src/screens/ClinicalInsight';
import SelectTests from './src/screens/SelectTests';
import SelectDiagnosis from './src/screens/SelectDiagnosis';
import SelectTreatment from './src/screens/SelectTreatment';
import OnboardingScreen from './src/screens/OnboardingScreen';
import NotificationPermission from './src/screens/NotificationPermission';
import HeartScreen from './src/screens/HeartScreen';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { getUser, updateUser, refreshHearts } from './src/store/slices/userSlice';
import RNBootSplash from 'react-native-bootsplash';
import {
  registerDeviceForRemoteMessages,
  getToken,
  subscribeToTopic,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  getMessaging,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import PremiumScreen from './src/screens/PremiumScreen';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { setCustomerInfo } from './src/store/slices/userSlice';
import SpInAppUpdates, { IAUUpdateKind, IAUInstallStatus } from 'sp-react-native-in-app-updates';
import { loadCaseById } from './src/store/slices/currentGameSlice';

// Pastel, subtle pink gradient (nearly white to light pink)
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize MMKV storage
const storage = new MMKV();

// Global navigation ref to allow programmatic navigation
export const navigationRef = createNavigationContainerRef();

/**
 * Handle notification deep-link navigation
 * When user taps a notification with { caseID, screen: "ClinicalInfo" },
 * navigate to Home first, wait for content to load, then open ClinicalInfo with the case data
 */
export const handleNotificationNavigation = async (remoteMessage, dispatch) => {
  try {
    const data = remoteMessage?.data;
    if (!data) return;

    const { caseID, screen } = data;

    // Only handle ClinicalInfo screen navigation for now
    if (screen === 'ClinicalInfo' && caseID) {
      // Wait for navigation to be ready
      const waitForNavigation = () => {
        return new Promise((resolve) => {
          const checkNavigation = () => {
            if (navigationRef.isReady()) {
              resolve(true);
            } else {
              setTimeout(checkNavigation, 100);
            }
          };
          checkNavigation();
        });
      };

      await waitForNavigation();

      // Step 1: First navigate to Home screen
      navigationRef.navigate('Tabs', { screen: 'Home' });

      // Step 2: Wait for Home screen to fully load and display content
      // This gives the user a moment to see the Home screen
      setTimeout(async () => {
        try {
          // Step 3: Load the case data using the caseID
          await dispatch(loadCaseById(caseID));

          // Step 4: Navigate to ClinicalInfo after case data is loaded
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('ClinicalInfo');
            }
          }, 300);
        } catch (error) {
          console.warn('Error loading case data:', error);
        }
      }, 1000); // Wait 1 second for Home content to load
    }
  } catch (error) {
    console.warn('Error handling notification navigation:', error);
  }
};

export const handleFCMTokenUpdate = async (dispatch, userData) => {
  try {
    // Ensure device is registered for remote messages before requesting a token
    try {
      await registerDeviceForRemoteMessages(getMessaging(getApp()));
    } catch (e) {
      console.warn('Failed to register device for remote messages', e);
    }

    // Step 1: Get current FCM token
    const currentFCMToken = await getToken(getMessaging(getApp()));

    // Step 2: Get locally stored user data (if available)
    const localUserDataString = storage.getString('user');
    let localUserData = null;
    if (localUserDataString) {
      try {
        localUserData = JSON.parse(localUserDataString);
      } catch (e) {
        console.warn('Failed to parse local user data', e);
      }
    }

    const localFCMToken = localUserData?.fcmToken;



    // Step 3: Compare current token with local token and update local if different
    if (localFCMToken !== currentFCMToken && localUserData) {
      localUserData.fcmToken = currentFCMToken;
      storage.set('user', JSON.stringify(localUserData));
    }

    // Step 4: Compare with server token - update server only if different
    if (userData && userData.fcmToken !== currentFCMToken) {

      const userId = userData?.userId || userData?._id || userData?.id;
      if (userId) {
        // Update user FCM token on server (can be null if permission denied)
        await dispatch(updateUser({
          userId,
          userData: { fcmToken: currentFCMToken }
        }));
      }
    } else {
      // console.log('Server FCM token matches, no update needed');
    }

    // Step 5: Subscribe to topic if notifications are enabled by user
    try {
      const notifEnabled = storage.getBoolean && storage.getBoolean('notifEnabled');
      if (notifEnabled) {
        await subscribeToTopic(getMessaging(getApp()), 'all_user');
      }
    } catch (e) {
      // console.warn('Failed to subscribe to topic all_user (token update flow)', e);
    }
  } catch (error) {
    // console.log('Error handling FCM token:', error);
  }
};

/* screens moved to src/screens */

/* ---------- tabs ---------- */
function RootTabs() {
  const colorScheme = useColorScheme();
  const themeColors = Colors.light;
  const insets = useSafeAreaInsets();
  const bottomExtra = Platform.OS === 'android' ? (insets.bottom || 0) : 0;
  const isAndroid12Plus = Platform.OS === 'android' && Number(Platform.Version) >= 31;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: themeColors.card, height: 44 },
        headerTitleStyle: { color: themeColors.text, fontWeight: '700', fontSize: 18 },
        headerTintColor: themeColors.text,
        tabBarActiveTintColor: Colors.brand.darkPink,
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isAndroid12Plus ? 'transparent' : 'rgba(242,242,242,0.92)'),
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,0,0,0.06)',
          elevation: 0,
          shadowOpacity: 0,
          height: (Platform.OS === 'ios' ? 84 : 64) + bottomExtra,
          paddingBottom: (Platform.OS === 'ios' ? 24 : 10) + bottomExtra,
          paddingTop: 10,
        },
        tabBarBackground: () => {
          if (Platform.OS === 'ios') {
            return (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={'light'}
                blurAmount={16}
                overlayColor="transparent"
              />
            );
          }
          // if (isAndroid12Plus) {
          //   return (
          //     <BlurView
          //       style={StyleSheet.absoluteFill}
          //       blurAmount={16}
          //       overlayColor="transparent"
          //       reducedTransparencyFallbackColor="rgba(242,242,242,0.92)"
          //     />
          //   );
          // }
          return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(242,242,242,0.92)' }]} />;
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          let icon = 'circle-outline';
          if (route.name === 'Home') icon = focused ? 'home-variant' : 'home-outline';
          if (route.name === 'Learnings') icon = 'book-open-variant';
          if (route.name === 'Ranking') icon = focused ? 'trophy' : 'trophy-outline';
          if (route.name === 'Account') icon = focused ? 'account-heart' : 'account-heart-outline';
          return <MaterialCommunityIcons name={icon} size={size} color={color} />;
        },
        sceneStyle: { backgroundColor: 'transparent', },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learnings" component={LearningScreen} />
      <Tab.Screen name="Ranking" component={LeagueScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

/* ---------- root component ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const themeColors = Colors.light;
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const inAppUpdates = useMemo(() => new SpInAppUpdates(__DEV__), []);

  // Ensure Purchases SDK is configured exactly once per app launch
  const purchasesConfiguredRef = React.useRef(false);
  const initPurchases = React.useCallback(async () => {
    try {
      if (purchasesConfiguredRef.current) return;
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: 'appl_OYDSUPXLqzuDLJSlmdMlsUJffIH' });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: 'goog_GZJTkFQaWlmsypgjConPmrRlioL' });
      }
      purchasesConfiguredRef.current = true;
    } catch (e) {
      // no-op; SDK will throw if misconfigured
    }
  }, []);

  const identifyPurchasesUser = React.useCallback(async (appUserId) => {
    try {
      // Only attempt identification if SDK was configured
      await initPurchases();
      if (appUserId) {
        await Purchases.logIn(String(appUserId));
      } else {
        // If no ID, make sure we are anonymous
        try { await Purchases.logOut(); } catch { }
      }
      await getCustomerInfo();
    } catch (e) {
      // swallow; UI can still work, and Premium screen will retry fetching
    }
  }, [initPurchases]);

  /* load stored credential once */
  useEffect(() => {
    try {
      const stored = storage.getString('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      console.warn('Failed to load user from storage', e);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const getCustomerInfo = async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    dispatch(setCustomerInfo(customerInfo));
  }

  useEffect(() => {
    if (__DEV__) {
      return;
    }
    let statusListener;
    const checkForUpdates = async () => {
      try {
        const result = await inAppUpdates.checkNeedsUpdate();
        if (!result?.shouldUpdate) {
          return;
        }
        if (Platform.OS === 'android') {
          statusListener = (event) => {
            if (event.status === IAUInstallStatus.DOWNLOADED) {
              Alert.alert(
                'Update ready',
                'A newer version has finished downloading. Restart to install now?',
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Restart', onPress: () => inAppUpdates.installUpdate() },
                ],
              );
            }
          };
          inAppUpdates.addStatusUpdateListener(statusListener);
          await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
        } else {
          await inAppUpdates.startUpdate({
            title: 'Update available',
            message: 'A new version is ready on the App Store.',
            buttonUpgradeText: 'Update',
            buttonCancelText: 'Later',
          });
        }
      } catch (error) {
        console.warn('Failed to run in-app update check', error);
      }
    };
    checkForUpdates();
    return () => {
      if (statusListener) {
        inAppUpdates.removeStatusUpdateListener(statusListener);
      }
    };
  }, [inAppUpdates]);

  // Configure Purchases SDK on app start (anonymous); user identification happens below
  useEffect(() => {
    initPurchases();
  }, [initPurchases]);

  // Initialize hearts from storage on app launch
  useEffect(() => {
    dispatch(refreshHearts());
  }, [dispatch]);

  // After interactive login, user state changes; fetch fresh user data from server
  useEffect(() => {
    if (!user) return;
    const uid = user?.userId || user?._id || user?.id;
    if (uid) {
      dispatch(getUser(uid));
    }
  }, [dispatch, user]);
  // storage.set('remoteMessage', JSON.stringify(remoteMessage?.data));

  // Identify RevenueCat user after first-time login (or when restored from storage)
  useEffect(() => {
    if (!user) return;
    const uid = user?.email || null;
    identifyPurchasesUser(uid);
  }, [user, identifyPurchasesUser]);
  // Listen for MMKV 'user' changes to react to logout/login instantly
  useEffect(() => {
    const listener = storage.addOnValueChangedListener((changedKey) => {
      if (changedKey !== 'user') return;
      try {
        const stored = storage.getString('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    });
    return () => {
      try { listener?.remove?.(); } catch { }
    };
  }, []);
  // FCM Token management - fetch user, get token, compare and update if different
  useEffect(() => {
    if (userData && userData?._id) {
      handleFCMTokenUpdate(dispatch, userData);
    }
  }, [userData]);

  // Handle token refresh to keep local and server in sync
  useEffect(() => {
    if (!userData || !userData?._id) return;
    const unsubscribe = onTokenRefresh(getMessaging(getApp()), async (refreshedToken) => {
      try {
        // Update local storage if needed
        const localUserDataString = storage.getString('user');
        if (localUserDataString) {
          try {
            const localUserData = JSON.parse(localUserDataString);
            if (localUserData?.fcmToken !== refreshedToken) {
              localUserData.fcmToken = refreshedToken;
              storage.set('user', JSON.stringify(localUserData));
            }
          } catch (e) {
            console.warn('Failed to parse local user during token refresh', e);
          }
        }
        // Update server if needed
        const userId = userData?.userId || userData?._id || userData?.id;
        if (userId && userData?.fcmToken !== refreshedToken) {
          await dispatch(updateUser({
            userId,
            userData: { fcmToken: refreshedToken }
          }));
        }
      } catch (e) {
        console.warn('Error syncing refreshed FCM token', e);
      }
    });
    return unsubscribe;
  }, [dispatch, userData]);

  // 3. Set up notification listeners
  useEffect(() => {
    // A. For foreground messages (when the app is open)
    const unsubscribe = onMessage(getMessaging(getApp()), async remoteMessage => {
      // Foreground messages are typically shown as in-app notifications
      // The user would need to tap them to navigate, which is handled by onNotificationOpenedApp
    });

    // B. For when the user taps a notification and the app is in the background
    const unsubscribeOpenedApp = onNotificationOpenedApp(getMessaging(getApp()), remoteMessage => {
      // Navigate to the appropriate screen based on notification data
      handleNotificationNavigation(remoteMessage, dispatch);
    });

    // C. For when the user taps a notification and the app is closed (quit)
    getInitialNotification(getMessaging(getApp())).then(remoteMessage => {
      if (remoteMessage) {
        // Navigate to the appropriate screen based on notification data
        handleNotificationNavigation(remoteMessage, dispatch);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOpenedApp();
    };
  }, [dispatch]);



  // Do not return a JS splash; native bootsplash covers until we hide it.

  const baseTheme = DefaultTheme;
  const shouldForceLogin = storage.getBoolean && storage.getBoolean('forceLogin');
  if (loading) {
    // Keep native bootsplash visible while we read local storage.
    return null;
  }
  const mergedTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors.brand.blue,
      background: 'transparent',
      card: themeColors.card,
      text: themeColors.text,
      border: themeColors.border,
      notification: Colors.brand.darkPink,
    },
  };

  return (
    <View style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <LinearGradient
          colors={SUBTLE_PINK_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // Hide native splash once navigation tree is ready
            try {
              RNBootSplash.hide({ fade: true });
            } catch { }
          }}
          theme={mergedTheme}
        >
          {user ? (
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
                statusBarTranslucent: true,
              }}
              initialRouteName={
                storage.getBoolean && !storage.getBoolean('notifDecided')
                  ? 'NotificationPermission'
                  : 'Tabs'
              }
            >
              <Stack.Screen
                name="NotificationPermission"
                component={NotificationPermission}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen name="Tabs" component={RootTabs} />
              <Stack.Screen
                name="ClinicalInfo"
                component={ClinicalInfo}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="ClinicalInsight"
                component={ClinicalInsight}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="SelectTests"
                component={SelectTests}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="SelectDiagnosis"
                component={SelectDiagnosis}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="SelectTreatment"
                component={SelectTreatment}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="Premium"
                component={PremiumScreen}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="Heart"
                component={HeartScreen}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
                statusBarTranslucent: true,
              }}
              initialRouteName={shouldForceLogin ? 'Login' : 'Onboarding'}
            >
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                  contentStyle: { backgroundColor: '#ffffff' },
                }}
              />
              <Stack.Screen name="Login">
                {() => <Login onLogin={setUser} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </BottomSheetModalProvider>
    </View>
  );
}

/* styles for screens are in src/screens/styles */
