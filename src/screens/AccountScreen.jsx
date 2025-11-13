import React, { useMemo, useCallback, useState } from 'react';
import { useColorScheme, View, Text, ScrollView, TouchableOpacity, Alert, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';
import { MMKV } from 'react-native-mmkv';
import googleAuth from '../services/googleAuth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/userSlice';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  registerDeviceForRemoteMessages,
  getToken,
  subscribeToTopic,
  requestPermission,
  hasPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const storage = useMemo(() => new MMKV(), []);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(0);
  const [osPermissionEnabled, setOsPermissionEnabled] = useState(true);

  const user = useMemo(() => {
    try {
      const raw = storage.getString('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, [storage]);

  // Notification status from persisted preference/decision
  const notifDecided = useMemo(
    () => (storage.getBoolean && storage.getBoolean('notifDecided')) || false,
    [storage, refresh]
  );
  const notifEnabled = useMemo(
    () => (storage.getBoolean && storage.getBoolean('notifEnabled')) || false,
    [storage, refresh]
  );
  const effectiveEnabled = notifEnabled && osPermissionEnabled;

  const computeOsPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        let status = null;
        try {
          status = await hasPermission(getMessaging(getApp()));
        } catch (e) {
          status = null;
        }
        if (typeof status === 'number') {
          setOsPermissionEnabled(
            status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
          );
        } else if (typeof status === 'boolean') {
          setOsPermissionEnabled(status);
        } else {
          setOsPermissionEnabled(true);
        }
      } else {
        if (Number(Platform.Version) >= 33) {
          const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          setOsPermissionEnabled(granted === true);
        } else {
          setOsPermissionEnabled(true);
        }
      }
    } catch {
      setOsPermissionEnabled(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      computeOsPermission();
    }, [computeOsPermission])
  );

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
            try { storage.delete('user'); } catch {}
          },
        },
      ]
    );
  }, [storage]);

  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      {/* <LeagueHeader onPressPro={() => {}} /> */}
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
          {!effectiveEnabled && (
            <View style={{ alignSelf: 'stretch', padding: 12, borderRadius: 12, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="bell-alert" size={22} color="#B45309" />
                <Text style={{ color: '#92400E', fontWeight: '900', marginLeft: 8 }}>Notifications are disabled</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ flex: 1, color: '#92400E', marginRight: 12 }}>
                  Turn on notifications to receive daily reminders and updates.
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      let granted = true;
                      if (Platform.OS === 'ios') {
                        const status = await requestPermission(getMessaging(getApp()));
                        granted = (status === AuthorizationStatus.AUTHORIZED) || (status === AuthorizationStatus.PROVISIONAL);
                      } else if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
                        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                        granted = res === PermissionsAndroid.RESULTS.GRANTED;
                      }
                      storage.set('notifDecided', true);
                      storage.set('notifEnabled', !!granted);
                      setRefresh(v => v + 1);
                      // Recompute OS permission immediately so banner hides without leaving the screen
                      await computeOsPermission();

                      if (granted) {
                        try {
                          await registerDeviceForRemoteMessages(getMessaging(getApp()));
                        } catch {}
                        try {
                          const token = await getToken(getMessaging(getApp()));
                          try {
                            const raw = storage.getString('user');
                            if (raw) {
                              const parsed = JSON.parse(raw);
                              parsed.fcmToken = token;
                              storage.set('user', JSON.stringify(parsed));
                            }
                          } catch {}
                          const userId = user?.userId || user?._id || user?.id;
                          if (userId && token) {
                            try {
                              await dispatch(updateUser({ userId, userData: { fcmToken: token } }));
                            } catch {}
                          }
                          try {
                            await subscribeToTopic(getMessaging(getApp()), 'all_user');
                          } catch {}
                        } catch {}
                      }
                    } catch (e) {
                      // no-op
                    }
                  }}
                  activeOpacity={0.9}
                  style={{ backgroundColor: Colors.brand.darkPink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, flexShrink: 0 }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '900' }}>Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
              <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


