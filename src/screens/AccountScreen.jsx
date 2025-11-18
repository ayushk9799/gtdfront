import React, { useMemo, useCallback } from 'react';
import { useColorScheme, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';
import { MMKV } from 'react-native-mmkv';
import googleAuth from '../services/googleAuth';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const storage = useMemo(() => new MMKV(), []);

  const user = useMemo(() => {
    try {
      const raw = storage.getString('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, [storage]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try { await googleAuth.signOut(); } catch {}
            try { await googleAuth.revoke?.(); } catch {}
            try {
              // Force App root to show unauthenticated stack at Login screen
              storage.set('forceLogin', true);
              storage.delete('user');
              // After clearing auth, reset navigation to Login explicitly
              setTimeout(() => {
                try {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } catch {}
              }, 0);
            } catch {}
          },
        },
      ]
    );
  }, [storage, navigation]);

  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LeagueHeader onPressPro={() => {}} />
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
          <View style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: '#FFE0EA',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: Colors.brand.darkPink }}>
              {user?.name?.[0]?.toUpperCase?.() || user?.email?.[0]?.toUpperCase?.() || 'U'}
            </Text>
          </View>
          <Text style={styles.title}>
            {user?.name || 'User'}
          </Text>
          {!!user?.email && (
            <Text style={styles.subtitle}>{user.email}</Text>
          )}
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacyPolicy')}
            style={[styles.primaryButton, { alignSelf: 'stretch', backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: '#1a1a1a', textAlign: 'center' }]}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TermsOfService')}
            style={[styles.primaryButton, { alignSelf: 'stretch', backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: '#1a1a1a', textAlign: 'center' }]}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={[styles.primaryButton, { alignSelf: 'stretch', backgroundColor: Colors.brand.darkPink }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
              <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


