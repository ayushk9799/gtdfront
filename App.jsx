/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Text, Platform, Image, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import Login from './src/Login';
import PrivacyPolicy from './src/PrivacyPolicy';
import TermsOfServiceScreen from './src/TermsOfService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from './constants/Colors';
import inappicon from './constants/inappicon.png';
import ClinicalInfo from './src/ClinicalInfo';

// Pastel, subtle pink gradient (nearly white to light pink)
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Initialize MMKV storage
const storage = new MMKV();

/* ---------- placeholder screens ---------- */
function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.screenScroll}>
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.cardContent}>
          <View style={styles.rowCenterBetween}>
            <View style={styles.rowCenter}>
              <MaterialCommunityIcons name="calendar-star" size={22} color={Colors.brand.darkPink} />
              <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Daily Challenge</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { marginTop: 8 }]}>
            Solve today’s case in under 3 tries to keep your streak alive.
          </Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={() => navigation.navigate('ClinicalInfo')}>
            <Text style={styles.primaryButtonText}>Solve the case</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Image source={inappicon} style={styles.gameImage} />
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Guess The Disease</Text>
          <Text style={styles.cardDesc}>
            A quick, fun medical guessing game. Look at the hint and pick the right
            diagnosis. New rounds every day.
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LearningScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={styles.centered}>
          <Text style={styles.title}>Learning</Text>
          <Text style={styles.subtitle}>Courses, cases, and practice</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LeagueScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={styles.centered}>
          <Text style={styles.title}>League</Text>
          <Text style={styles.subtitle}>Ranks, seasons, and rewards</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={styles.centered}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Profile and settings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- tabs ---------- */
function RootTabs() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
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
          backgroundColor: 'rgba(242,242,242,0.92)',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,0,0,0.06)',
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
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
        sceneStyle: { backgroundColor: 'transparent' },
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
      background: 'transparent',
      card: themeColors.card,
      text: themeColors.text,
      border: themeColors.border,
      notification: Colors.brand.darkPink,
    },
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <NavigationContainer theme={mergedTheme}>
        {user ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7 },
  gameContainer: { padding: 16 },
  screenScroll: { padding: 16, paddingBottom: 120, flexGrow: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    // Bluish, subtle shadow
    shadowColor: '#1E88E5',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gameImage: { width: '100%', height: 180, resizeMode: 'contain', backgroundColor: 'transparent' },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 20, color: '#687076' },
  rowCenterBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: Colors.brand.lightPink, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { color: Colors.brand.darkPink, fontWeight: '700', fontSize: 12 },
  primaryButton: {
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: Colors.brand.darkPink,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '800' },
});
