/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { initializeAndroidNotifications, registerAndroidNotificationTapHandlers } from './src/notifications/NotificationManager';

// Pastel, subtle pink gradient (nearly white to light pink)
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize MMKV storage
const storage = new MMKV();

/* screens moved to src/screens */

/* ---------- tabs ---------- */
function RootTabs() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
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
                blurType={colorScheme === 'dark' ? 'dark' : 'light'}
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
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigationRef = React.useRef(createNavigationContainerRef());
  const pendingTapDataRef = React.useRef(null);

  /* load stored credential once */
  useEffect(() => {
    try {
      const stored = storage.getString('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load user from storage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Android-only: initialize notifications
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let cleanup = () => {};
    initializeAndroidNotifications().then(fn => {
      if (typeof fn === 'function') cleanup = fn;
    });
    return () => cleanup();
  }, []);

  // Android-only: handle notification taps (background and cold start)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const unsubscribe = registerAndroidNotificationTapHandlers({
      onBackgroundTap: (data) => {
        tryNavigateToClinicalInfo(data);
      },
      onColdStartTap: (data) => {
        // queue until navigation is ready
        pendingTapDataRef.current = data || {};
        tryNavigateToClinicalInfo(data);
      },
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

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

  if (loading) return null; // splash screen placeholder

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
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
          {!user ? (
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
                statusBarTranslucent: true,
              }}
            >
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
