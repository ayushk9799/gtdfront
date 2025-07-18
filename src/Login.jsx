import {
  signUpWithGoogle,
  signUpWithApple,
} from 'react-native-credentials-manager';

import React, { useState } from 'react';
import { API_BASE } from '../constants/Api.jsx';
import inappicon from '../constants/inappicon.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

async function platformSpecificSignUp() {
  try {
    if (Platform.OS === 'android') {
      // Android: Google Sign-In
      const googleCredential = await signUpWithGoogle({
        serverClientId:
          '125181194595-uautevfk4s33h57gi28hougs7lruet70.apps.googleusercontent.com',
        autoSelectEnabled: false,
      });

      const ans = await fetch(`${API_BASE}/api/login/google/loginSignUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleCredential.idToken,
        }),
      });
      const data = await ans.json();
      return data;
    } else {
      // iOS: Apple Sign In
      const appleCredential = await signUpWithApple({
        nonce: 'OPTIONAL_NONCE_FOR_SECURITY',
        requestedScopes: ['fullName', 'email'],
      });

      return {
        type: 'apple',
        token: appleCredential.idToken,
        id: appleCredential.id,
        user: {
          name: appleCredential.displayName,
          givenName: appleCredential.givenName,
          familyName: appleCredential.familyName,
          email: appleCredential.email,
        },
      };
    }
  } catch (error) {
    console.error('Platform-specific sign-up failed:', error);
    throw error;
  }
}

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const credential = await platformSpecificSignUp();
    
      // Persist user credential
      await AsyncStorage.setItem('user', JSON.stringify(credential?.user));
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
      <View style={styles.logoContainer}>
        <Image source={inappicon} style={styles.logo} />
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', fontStyle: 'italic' }}>
          Guess The Disease
        </Text>
        <Text style={styles.subtitleText}>A fun way to engage your mind</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : (
        <TouchableOpacity
          style={styles.gsiMaterialButton}
          onPress={handleSignIn}
          activeOpacity={1}
          disabled={isLoading}
        >
          <View style={styles.contentGroup}>
            <View style={styles.gsiMaterialButtonIcon}>
              <Svg width="20" height="20" viewBox="0 0 48 48">
                <Path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <Path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <Path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <Path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </Svg>
            </View>
            <Text style={styles.gsiMaterialButtonContents}>
              {Platform.OS === 'ios'
                ? 'Sign in with Apple'
                : 'Sign in with Google'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  gsiMaterialButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#747775',
    borderRadius: 25,
    padding: 12,
    alignSelf: 'center',
  },

  contentGroup: {
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'center',
  },
  gsiMaterialButtonIcon: {
    height: 20,
    width: 20,
    marginRight: 8,
    justifyContent: 'center',
  },
  gsiMaterialButtonContents: {
    color: '#1f1f1f',
    fontSize: 16,
    letterSpacing: 0.25,
    fontFamily: 'Roboto-Medium',
    fontWeight: 'bold',
  },
});

export default Login;
