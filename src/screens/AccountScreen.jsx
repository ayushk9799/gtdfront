import React, { useMemo, useCallback, useState } from 'react';
import { useColorScheme, View, Text, ScrollView, TouchableOpacity, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';
import { MMKV } from 'react-native-mmkv';
import googleAuth from '../services/googleAuth';
import { API_BASE } from '../../constants/Api';
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
import { useSelector } from 'react-redux';
import CloudBottom from '../components/CloudBottom';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const storage = useMemo(() => new MMKV(), []);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(0);
  const [osPermissionEnabled, setOsPermissionEnabled] = useState(true);
  const { isPremium, customerInfo } = useSelector(state => state.user);
 
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

  const activeEntitlements = customerInfo?.entitlements?.active || {};
  const activeEntitlementsArray = Object.values(activeEntitlements || {});
  const premiumPlan =
    activeEntitlementsArray?.[0]?.productIdentifier ||
    customerInfo?.activeSubscriptions?.[0] ||
    null;
  const premiumExpiresAt = activeEntitlementsArray?.[0]?.expirationDate || null;
  const planLabelFromId = (id) => {
    try {
      if (!id) return 'Active subscription';
      const lower = String(id).toLowerCase();
      if (lower.includes('week')) return 'Weekly Plan';
      if (lower.includes('month')) return 'Monthly Plan';
      if (lower.includes('year') || lower.includes('annual')) return 'Annual Plan';
      if (lower.includes('life')) return 'Lifetime';
      return 'Active subscription';
    } catch {
      return 'Active subscription';
    }
  };
  const formatDate = (iso) => {
    try {
      if (!iso) return 'Active';
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Active';
    }
  };

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

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including game progress, scores, and premium subscriptions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.userId || user?._id || user?.id;
              if (!userId) {
                Alert.alert('Error', 'Unable to identify user. Please try logging out and back in.');
                return;
              }

              // Call backend delete endpoint
              const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              const data = await response.json();

              if (!response.ok || data?.error) {
                Alert.alert('Error', data?.error || 'Failed to delete account. Please try again.');
                return;
              }

              // Clear all local storage
              try {
                storage.clearAll();
              } catch (e) {
                console.warn('Error clearing local storage:', e);
              }

              // Sign out from Google
              try { await googleAuth.signOut(); } catch {}
              try { await googleAuth.revoke?.(); } catch {}

              // Reset navigation to Login screen
              setTimeout(() => {
                try {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } catch {}
              }, 0);
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  }, [user, storage, navigation]);

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

        {isPremium && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#EDEDED',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="crown" size={22} color={Colors.brand.darkPink} />
                <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                  You’re Premium
                </Text>
              </View>
              <Text style={{ color: '#4A5564', marginBottom: 12 }}>
                Thanks for subscribing! You now have unlimited access to all features.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>Plan</Text>
                  <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    {planLabelFromId(premiumPlan)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>Renews/Expires</Text>
                  <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    {formatDate(premiumExpiresAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
            onPress={() => Linking.openURL('https://www.diagnoseit.in/privacy')}
            style={[styles.primaryButton, { alignSelf: 'stretch', backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: '#1a1a1a', textAlign: 'center' }]}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.diagnoseit.in/terms')}
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

          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
            style={[styles.primaryButton, { alignSelf: 'stretch', backgroundColor: '#DC2626', marginTop: 8 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <MaterialCommunityIcons name="delete-outline" size={18} color="#ffffff" />
              <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
