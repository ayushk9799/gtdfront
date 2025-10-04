/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Text, Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Login from './src/Login';
import PrivacyPolicy from './src/PrivacyPolicy';
import TermsOfServiceScreen from './src/TermsOfService';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from './constants/Colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize MMKV storage
const storage = new MMKV();

/* ---------- placeholder screens ---------- */
function GameScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Game</Text>
      <Text style={styles.subtitle}>First game screen placeholder</Text>
    </View>
  );
}

function ThingsScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Things</Text>
      <Text style={styles.subtitle}>Your items and progress</Text>
    </View>
  );
}

function AccountScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Profile and settings</Text>
    </View>
  );
}

/* ---------- tabs ---------- */
function RootTabs() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: themeColors.card, height: 44 },
        headerTitleStyle: { color: themeColors.text, fontWeight: '700', fontSize: 18 },
        headerTintColor: themeColors.text,
        tabBarActiveTintColor: themeColors.tabIconSelected,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(21,23,24,0.85)'
            : 'rgba(255,255,255,0.85)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          let icon = 'circle';
          if (route.name === 'Game') icon = focused ? 'play-circle' : 'play';
          if (route.name === 'Things') icon = 'list';
          if (route.name === 'Account') icon = 'user';
          return <Feather name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Game" component={GameScreen} />
      <Tab.Screen name="Things" component={ThingsScreen} />
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

  if (loading) return null; // splash screen placeholder

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const mergedTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors.brand.blue,
      background: themeColors.background,
      card: themeColors.card,
      text: themeColors.text,
      border: themeColors.border,
      notification: Colors.brand.darkPink,
    },
  };

  return (
    <NavigationContainer theme={mergedTheme}>
      {user ? (
        <RootTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <Login onLogin={setUser} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7 },
});
