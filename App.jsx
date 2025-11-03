/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Platform, PermissionsAndroid, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import Login from './src/Login';
import PrivacyPolicy from './src/PrivacyPolicy';
import TermsOfServiceScreen from './src/TermsOfService';
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
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { getUser, updateUser } from './src/store/slices/userSlice';
import messaging from '@react-native-firebase/messaging';

// Pastel, subtle pink gradient (nearly white to light pink)
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize MMKV storage
const storage = new MMKV();


export const handleFCMTokenUpdate = async (dispatch, userData) => {
  try {
    // Step 1: Get current FCM token
    const currentFCMToken = await messaging().getToken();
    
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
    
    console.log('Current FCM Token:', currentFCMToken);
    console.log('Local FCM Token:', localFCMToken);
    console.log('Server FCM Token:', userData?.fcmToken);

    // Step 3: Compare current token with local token and update local if different
    if (localFCMToken !== currentFCMToken && localUserData) {
      console.log('FCM token changed, updating local storage...');
      localUserData.fcmToken = currentFCMToken;
      storage.set('user', JSON.stringify(localUserData));
    }

    // Step 4: Compare with server token - update server only if different
    if (userData && userData.fcmToken !== currentFCMToken) {
      console.log('Server FCM token differs, updating server...');
      
      const userId = userData?.userId || userData?._id || userData?.id;
      if (userId) {
        // Update user FCM token on server (can be null if permission denied)
        await dispatch(updateUser({
          userId,
          userData: { fcmToken: currentFCMToken }
        }));
      }
    } else {
      console.log('Server FCM token matches, no update needed');
    }
  } catch (error) {
    console.log('Error handling FCM token:', error);
  }
};

/* screens moved to src/screens */

/* ---------- tabs ---------- */
function RootTabs() {
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
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
        tabBarActiveTintColor: '#333333',
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
                blurType={ 'light'}
                blurAmount={16}
                overlayColor="transparent"
              />
            );
          }
          if (isAndroid12Plus) {
            return (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurAmount={16}
                overlayColor="transparent"
                reducedTransparencyFallbackColor="rgba(242,242,242,0.92)"
              />
            );
          }
          return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(242,242,242,0.92)' }]} />;
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          let icon = 'circle-outline';
          if (route.name === 'Home') icon = focused ? 'home-variant' : 'home-outline';
          if (route.name === 'Learning') icon = 'book-open-variant';
          if (route.name === 'League') icon = focused ? 'trophy' : 'trophy-outline';
          if (route.name === 'Account') icon = focused ? 'account-heart' : 'account-heart-outline';
          return <MaterialCommunityIcons name={icon} size={size} color={color} />;
        },
        sceneStyle: { backgroundColor: 'transparent',  },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="League" component={LeagueScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

/* ---------- root component ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
  const navigationRef = React.useRef(createNavigationContainerRef());
  const pendingTapDataRef = React.useRef(null);
  const dispatch = useDispatch();
  const {userData} = useSelector(state => state.user);

  /* load stored credential once */
  useEffect(() => {
    try {
      const stored = storage.getString('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        const uid = parsed?.userId || parsed?._id || parsed?.id;
        console.log("uid", uid);
        if (uid) dispatch(getUser(uid));
        
        console.log("fetched user");
      }
    } catch (e) {
      console.warn('Failed to load user from storage', e);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // FCM Token management - fetch user, get token, compare and update if different
  useEffect(() => {
    if (userData && userData?._id) {
      handleFCMTokenUpdate(dispatch, userData);
    }
  }, [userData]);

 

  // 3. Set up notification listeners
  useEffect(() => {
    // A. For foreground messages (when the app is open)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    // B. For when the user taps a notification and the app is in the background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
      // e.g., navigate to a specific screen
    });

    // C. For when the user taps a notification and the app is closed (quit)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
        }
      });

    return unsubscribe;
  }, []);

  // Android-only: initialize notifications
  // useEffect(() => {
  //   // if (Platform.OS !== 'android') return;
  //   let cleanup = () => {};
  //   initializeAndroidNotifications(dispatch).then(fn => {
  //     if (typeof fn === 'function') cleanup = fn;
  //   });
  //   return () => cleanup();
  // }, []);

  // Android-only: handle notification taps (background and cold start)
  // useEffect(() => {
  //   // if (Platform.OS !== 'android') return;
  //   const unsubscribe = registerAndroidNotificationTapHandlers({
  //     onBackgroundTap: (data) => {
  //       tryNavigateToClinicalInfo(data);
  //     },
  //     onColdStartTap: (data) => {
  //       // queue until navigation is ready
  //       pendingTapDataRef.current = data || {};
  //       tryNavigateToClinicalInfo(data);
  //     },
  //   });
  //   return () => {
  //     if (typeof unsubscribe === 'function') unsubscribe();
  //   };
  // }, []);

  function tryNavigateToClinicalInfo(data) {
    const payload = data || {};
    // If navigator is ready, navigate immediately; else queue
    if (navigationRef.current && navigationRef.current.isReady()) {
      try {
        navigationRef.current.navigate(`${payload.screen}`, payload);
        pendingTapDataRef.current = null;
      } catch (e) {
        console.warn('Navigation to ClinicalInfo failed', e);
      }
    } else {
      pendingTapDataRef.current = payload;
    }
  }

  console.log("user", user);

  /* react to auth changes (login/logout) */
  // Removed storage change listener; rely on explicit login/logout actions instead

  if (loading) return null; // splash screen placeholder

  const baseTheme =  DefaultTheme;
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
            if (pendingTapDataRef.current) {
              tryNavigateToClinicalInfo(pendingTapDataRef.current);
            }
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
                name="PrivacyPolicy"
                component={PrivacyPolicy}
                options={{
                  animation: Platform.OS === 'ios' ? 'slide_from_right' : 'slide_from_right',
                  presentation: 'card',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
              <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
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
