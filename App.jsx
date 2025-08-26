/**
 * App entry – uses a drawer (vertical tab) when the user is signed-in.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';

import Game from './src/Game';
import Login from './src/Login';
import UserProfile from './src/UserProfile';
import Feather from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();



/* ---------- custom drawer ---------- */
const CustomDrawerContent = React.memo(function CustomDrawerContent({
  user,
  setUser,
  navigation,
  ...rest
}) {
  const colorScheme = useColorScheme();
  const dynamicTextColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const dynamicBackgroundColor = colorScheme === 'dark' ? '#1e1e1e' : '#ffffff';
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <DrawerContentScrollView
      {...rest}
      style={{
        backgroundColor: dynamicBackgroundColor,
        flex: 1,
      }}
    >
      {/* User Info Section */}
      <View style={[styles.userInfoSection]}>
        <View style={[styles.userIconContainer, { backgroundColor: dynamicTextColor }]}>
          <Feather name="user" size={40} color={dynamicBackgroundColor} />
        </View>
        <Text style={[ { color: dynamicTextColor , fontWeight: 'bold'}]}>
          {user?.name}
        </Text>
        <Text style={[styles.userEmail, { color: dynamicTextColor }]}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.divider} />

      <DrawerItem
        label="Game"
        onPress={() => navigation.navigate('Game')}
        labelStyle={{ color: dynamicTextColor, fontSize: 16 }}
        icon={({ focused, size }) => (
          <Feather name="play" size={size} color={dynamicTextColor} />
        )}
      />
      <DrawerItem
        label="Logout"
        onPress={handleLogout}
        labelStyle={{ color: '#FF4444', fontSize: 16 }}
        icon={({ focused, size }) => (
          <Feather name="log-out" size={size} color="#FF4444" />
        )}
      />
    </DrawerContentScrollView>
  );
});

/* ---------- root component ---------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
const dynamicTextColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
const dynamicBackgroundColor = colorScheme === 'dark' ? '#151718' : '#ffffff';

  /* load stored credential once */
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to load user from storage', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null; // splash screen placeholder

  return (
    <NavigationContainer>
      {user ? (
        <Drawer.Navigator
          screenOptions={({ navigation }) => ({
            headerShown: true,
            // Thin hamburger icon from Feather to toggle the drawer
            headerLeft: () => (
              <Feather
                name="menu"
                size={30}
                color={dynamicTextColor}
                style={{ marginLeft: 16 }}
                onPress={() => navigation.toggleDrawer()}
              />
            ),
            headerStyle: {
              backgroundColor: dynamicBackgroundColor,
              height: 40
            },
            headerTitle: 'Diagnose It',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: dynamicTextColor,
             
            },
            headerTitleAlign: 'center',
            headerTintColor: '#333',
            headerShadowVisible: false, // iOS
            elevation: 0, // Android shadow
            drawerType: 'front',
            swipeEdgeWidth: 50,
            // Drawer specific styling
            drawerStyle: {
              backgroundColor: dynamicBackgroundColor,
              width: 280,
             
            },
            drawerActiveBackgroundColor: dynamicBackgroundColor,
            drawerInactiveBackgroundColor: dynamicBackgroundColor,
            drawerActiveTintColor: dynamicTextColor,
            drawerInactiveTintColor: dynamicTextColor,
          })}
          drawerContent={props => (
            <CustomDrawerContent {...props} user={user} setUser={setUser} />
          )}
        >
          <Drawer.Screen name="Game" component={Game} />
         
        </Drawer.Navigator>
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
  userInfoSection: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  userIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2A2D2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2D2E',
    marginHorizontal: 20,
    marginVertical: 10,
  },
});
