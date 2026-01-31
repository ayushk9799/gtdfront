import React, { useMemo, useCallback, useState } from 'react';
import { useColorScheme, View, Text, ScrollView, TouchableOpacity, Alert, Platform, PermissionsAndroid, Linking, Share } from 'react-native';
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
import { requestInAppReview, isReviewAvailable } from '../services/ratingService';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const storage = useMemo(() => new MMKV(), []);
  const dispatch = useDispatch();
  const [refresh, setRefresh] = useState(0);
  const [osPermissionEnabled, setOsPermissionEnabled] = useState(true);
  const { isPremium, customerInfo, userData } = useSelector(state => state.user);
  const referralCode = userData?.referralCode || '';

  const onShareWithFriend = useCallback(async () => {
    try {
      const shareMessage = referralCode
        ? `🩺 Learning medicine the real way!
Diagnose It lets you treat patients step-by-step like real OPD cases.
Use my referral code ${referralCode} while signing up ❤️
Join me 👉 https://diagnoseit.in`
        : '🎯 Hey! I\'m solving real clinical cases with Diagnose It! It is real and fun - you can treat patients like a real doctor. Join here: https://diagnoseit.in';

      await Share.share({
        message: shareMessage,
        title: 'Invite to Diagnose It',
      });
    } catch (error) {
      // Handle error silently
    }
  }, [referralCode]);

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
            try { await googleAuth.signOut(); } catch { }
            try { await googleAuth.revoke?.(); } catch { }
            try {
              // Force App root to show unauthenticated stack at Login screen
              storage.set('forceLogin', true);
              storage.delete('user');
              // After clearing auth, reset navigation to Login explicitly
              setTimeout(() => {
                try {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } catch { }
              }, 0);
            } catch { }
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
              try { await googleAuth.signOut(); } catch { }
              try { await googleAuth.revoke?.(); } catch { }

              // Reset navigation to Login screen
              setTimeout(() => {
                try {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } catch { }
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
    <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
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
              {userData?.name?.[0]?.toUpperCase?.() || user?.name?.[0]?.toUpperCase?.() || user?.email?.[0]?.toUpperCase?.() || 'U'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.title}>
              {userData?.name || user?.name || 'User'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditAccount')}
              activeOpacity={0.7}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#FFE0EA',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={Colors.brand.darkPink} />
            </TouchableOpacity>
          </View>
          {!!(userData?.email || user?.email) && (
            <Text style={styles.subtitle}>{userData?.email || user?.email}</Text>
          )}

          {/* Stats Section */}
          <View style={{
            flexDirection: 'row',
            marginTop: 16,
            paddingHorizontal: 0,
            gap: 10,
          }}>
            {/* Cases Completed */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Learnings')}
              style={{
                flex: 1,
                flexDirection: 'row',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#E8F5E9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#43A047" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                  {(userData?.completedCases?.length || 0) + (userData?.completedDailyChallenges?.length || 0)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#888888' }}>
                  Cases Solved
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cumulative Points */}
            <View style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#FFF8E1',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <MaterialCommunityIcons name="star-circle" size={20} color="#FFA000" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                  {parseInt(userData?.cumulativePoints?.total || 0)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#888888' }}>
                  Total Points
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isPremium && (
          <View style={{ paddingHorizontal: 0, marginBottom: 8 }}>
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
                  <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>
                    {String(premiumPlan).toLowerCase().includes('life') ? 'Status' : 'Renews/Expires'}
                  </Text>
                  <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    {String(premiumPlan).toLowerCase().includes('life') ? 'Never expires ✨' : formatDate(premiumExpiresAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Notification Banner */}
        {!effectiveEnabled && (
          <View style={{
            marginHorizontal: 0,
            marginBottom: 16,
            padding: 16,
            borderRadius: 16,
            backgroundColor: '#FEF3C7',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="bell-alert" size={22} color="#B45309" />
              <Text style={{ color: '#92400E', fontWeight: '900', marginLeft: 8, fontSize: 15 }}>Notifications are disabled</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ flex: 1, color: '#92400E', marginRight: 12, fontSize: 13, lineHeight: 18 }}>
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
                    await computeOsPermission();

                    if (granted) {
                      try {
                        await registerDeviceForRemoteMessages(getMessaging(getApp()));
                      } catch { }
                      try {
                        const token = await getToken(getMessaging(getApp()));
                        try {
                          const raw = storage.getString('user');
                          if (raw) {
                            const parsed = JSON.parse(raw);
                            parsed.fcmToken = token;
                            storage.set('user', JSON.stringify(parsed));
                          }
                        } catch { }
                        const userId = user?.userId || user?._id || user?.id;
                        if (userId && token) {
                          try {
                            await dispatch(updateUser({ userId, userData: { fcmToken: token } }));
                          } catch { }
                        }
                        try {
                          await subscribeToTopic(getMessaging(getApp()), 'all_user');
                        } catch { }
                      } catch { }
                    }
                  } catch (e) {
                    // no-op
                  }
                }}
                activeOpacity={0.9}
                style={{
                  backgroundColor: '#B45309',
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                  flexShrink: 0
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Card */}
        <View style={{
          marginHorizontal: 0,
          marginBottom: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden',
        }}>
          {/* Refer a Friend */}
          <TouchableOpacity
            onPress={onShareWithFriend}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
              backgroundColor: '#FFFFFF',
            }}
            activeOpacity={0.6}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FFF0F0',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <MaterialCommunityIcons name="gift-outline" size={22} color="#ff4d4f" />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>Refer a Friend</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF0F0',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                marginLeft: 8,
              }}>
                <MaterialCommunityIcons name="heart" size={12} color="#ff4d4f" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#ff4d4f', marginLeft: 3 }}>+1</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 72 }} />

          {/* Rate the App */}
          <TouchableOpacity
            onPress={async () => {
              if (isReviewAvailable()) {
                await requestInAppReview();
              } else {
                const storeUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/id<YOUR_APP_ID>'
                  : 'https://play.google.com/store/apps/details?id=com.diagnoseit';
                Linking.openURL(storeUrl);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
              backgroundColor: '#FFFFFF',
            }}
            activeOpacity={0.6}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FFF5F8',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <MaterialCommunityIcons name="star" size={22} color={Colors.brand.darkPink} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>Rate the App</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 72 }} />

          {/* Privacy Policy */}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.diagnoseit.in/privacy')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
              backgroundColor: '#FFFFFF',
            }}
            activeOpacity={0.6}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#F5F5F7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#4A5568" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 72 }} />

          {/* Terms of Service */}
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.diagnoseit.in/terms')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 18,
              backgroundColor: '#FFFFFF',
            }}
            activeOpacity={0.6}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#F5F5F7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#4A5568" />
            </View>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>Terms of Service</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 0, gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              alignSelf: 'stretch',
              backgroundColor: Colors.brand.darkPink,
              paddingVertical: 16,
              borderRadius: 14,
              shadowColor: Colors.brand.darkPink,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
