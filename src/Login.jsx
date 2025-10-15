import { signUpWithGoogle } from 'react-native-credentials-manager';

import React, { useState } from 'react';
import { API_BASE } from '../constants/Api.jsx';
import senior from '../constants/senior3.jpeg';
import { MMKV } from 'react-native-mmkv';
import { View, TouchableOpacity, Platform, ActivityIndicator, Text, StyleSheet, Image, useColorScheme, Dimensions } from 'react-native';
import googleAuth from './services/googleAuth';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants/Colors.jsx';

// Initialize MMKV storage
const storage = new MMKV();
const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const HERO_FADE_HEIGHT = Math.round(WINDOW_HEIGHT * 0.35);

async function platformSpecificSignUp() {
  try {
    if (Platform.OS === 'android') {
      // Android: Google Sign-In
      const googleCredential = await signUpWithGoogle({
        serverClientId:
          '125181194595-uautevfk4s33h57gi28hougs7lruet70.apps.googleusercontent.com',
        autoSelectEnabled: false,
      });
   console.log(googleCredential);
      const ans = await fetch(`${API_BASE}/api/login/google/loginSignUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleCredential.idToken,
          platform: 'android',
        }),
      });
      const data = await ans.json();
      return data;
    } else {
      // iOS: Google Sign-In via native module (keep Android flow unchanged)
      console.log("signing in with google", googleAuth);
      const result = await googleAuth.signIn();
      console.log("result", result);
      if (!result?.idToken) throw new Error('No idToken from Google');
      const ans = await fetch(`${API_BASE}/api/login/google/loginSignUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result.idToken }),
      });
      const data = await ans.json();
      return data;
    }
  } catch (error) {
    console.error('Platform-specific sign-up failed:', error);
    throw error;
  }
}

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const credential = await platformSpecificSignUp();
    
      // Persist user credential
      storage.set('user', JSON.stringify(credential?.user));
      if (typeof onLogin === 'function') {
        onLogin(credential?.user);
      }
      // TODO: navigate or store auth data as needed
    } catch (error) {
      console.error('Sign-in failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroContainer}>
        <Image source={senior} style={styles.heroImage} />
        <View style={styles.thoughtContainer} pointerEvents="none">
          <View style={styles.thoughtBubble}>
            <Text style={styles.thoughtText}>The more you diagnose, the better you become.</Text>
          </View>
          <View style={styles.thoughtTrail}>
            <View style={styles.trailDot1} />
            <View style={styles.trailDot2} />
            <View style={styles.trailDot3} />
            <View style={styles.trailDot4} />
          </View>
        </View>
        <LinearGradient
          colors={[ 'rgba(255,255,255,0)', '#ffffff' ]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroFade, { height: HERO_FADE_HEIGHT }]}
          pointerEvents="none"
        />
        <View style={styles.ctaContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.brand.darkPink} />
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: themeColors.border },
              ]}
              onPress={handleSignIn}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              <View style={styles.contentGroup}>
                <View style={styles.buttonIcon}>
                  <Svg width="20" height="20" viewBox="0 0 48 48">
                    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </Svg>
                </View>
                <Text style={styles.primaryButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    marginTop: 6,
    marginBottom: 28,
    alignItems: 'center',
  },
  heroContainer: {
    width: '100%',
    height: WINDOW_HEIGHT,
    marginTop: -24,
    marginBottom: 0,
    marginLeft: -24,
    marginRight: -24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 0,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  thoughtContainer: {
    position: 'absolute',
    top: 96,
    left: 24,
    right: 24,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  thoughtBubble: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  thoughtText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  thoughtTrail: {
    marginTop: 10,
    marginLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailDot1: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  trailDot2: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    marginLeft: 10,
    transform: [{ translateY: 4 }],
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  trailDot3: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    marginLeft: 10,
    transform: [{ translateY: 8 }],
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  trailDot4: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    marginLeft: 10,
    transform: [{ translateY: 11 }],
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 14,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.brand.darkPink,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    marginBottom: 30,
  },
  primaryButton: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 22,
    minHeight: 56,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  ctaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  contentGroup: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'center',
  },
  buttonIcon: {
    height: 20,
    width: 20,
    marginRight: 8,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1f1f1f',
    fontSize: 16,
    letterSpacing: 0.3,
    fontFamily: 'Roboto-Medium',
    fontWeight: '900',
  },
});

export default Login;
