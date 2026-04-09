import React, { useMemo, useCallback, useState, useRef } from 'react';
import { useColorScheme, View, Text, ScrollView, TouchableOpacity, Alert, Platform, PermissionsAndroid, Linking, Share, StyleSheet } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import { changeLanguage, getLanguage } from '../i18n';
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
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

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
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(getLanguage());
  const langSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['50%'], []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const LANGUAGES = [
    { code: 'en', label: 'English', secondary: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', secondary: 'German', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', secondary: 'French', flag: '🇫🇷' },
    { code: 'es', label: 'Español', secondary: 'Spanish', flag: '🇪🇸' },
  ];
  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const handleLanguageChange = useCallback(() => {
    langSheetRef.current?.present();
  }, []);

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
      t('account.logOut'),
      t('account.logOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.logOut'),
          style: 'destructive',
          onPress: async () => {
            try { await googleAuth.signOut(); } catch { }
            try { await googleAuth.revoke?.(); } catch { }
            try {
              storage.set('forceLogin', true);
              storage.delete('user');
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
  }, [storage, navigation, t]);

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      t('account.deleteAccount'),
      t('account.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.userId || user?._id || user?.id;
              if (!userId) {
                Alert.alert(t('account.error'), t('account.unableToIdentifyUser'));
                return;
              }

              const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              const data = await response.json();

              if (!response.ok || data?.error) {
                Alert.alert(t('account.error'), data?.error || t('account.failedToDelete'));
                return;
              }

              try {
                storage.clearAll();
              } catch (e) {
                console.warn('Error clearing local storage:', e);
              }

              try { await googleAuth.signOut(); } catch { }
              try { await googleAuth.revoke?.(); } catch { }

              setTimeout(() => {
                try {
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                } catch { }
              }, 0);
            } catch (err) {
              Alert.alert(t('account.error'), err?.message || t('account.failedToDelete'));
            }
          },
        },
      ]
    );
  }, [user, storage, navigation, t]);

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
                  {t('account.casesSolved')}
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
                  {t('account.totalPoints')}
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
                    {String(premiumPlan).toLowerCase().includes('life') ? t('account.status') : t('account.renewsExpires')}
                  </Text>
                  <Text style={{ color: '#1E1E1E', fontSize: 14, fontWeight: '800', marginTop: 2 }}>
                    {String(premiumPlan).toLowerCase().includes('life') ? t('account.neverExpires') : formatDate(premiumExpiresAt)}
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
              <Text style={{ color: '#92400E', fontWeight: '900', marginLeft: 8, fontSize: 15 }}>{t('account.notificationsDisabled')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ flex: 1, color: '#92400E', marginRight: 12, fontSize: 13, lineHeight: 18 }}>
                {t('account.notificationsDesc')}
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
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>{t('account.allow')}</Text>
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>{t('account.referAFriend')}</Text>
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

          <View style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 72 }} />

          {/* Language Picker */}
          <TouchableOpacity
            onPress={handleLanguageChange}
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
              backgroundColor: '#F0F8FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
              <Text style={{ fontSize: 20 }}>{currentLangObj.flag}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>{t('account.language')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#888888', marginTop: 2 }}>{currentLangObj.label}</Text>
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
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>{t('account.rateTheApp')}</Text>
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
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>{t('account.privacyPolicy')}</Text>
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
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1E1E1E' }}>{t('account.termsOfService')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 0, gap: 12, marginBottom: 160 }}>
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
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16, marginLeft: 10 }}>{t('account.logOut')}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.35 }} />
      </ScrollView>

      <BottomSheetModal
        ref={langSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: '#D1D1D6', width: 40 }}
        backgroundStyle={{ borderRadius: 32 }}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 20 }}>
          <View style={{ marginTop: 8, marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1C1C1E' }}>
              {t('account.language')}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    changeLanguage(lang.code);
                    setCurrentLang(lang.code);
                    langSheetRef.current?.dismiss();
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: isSelected ? '#FFF0F5' : '#F2F2F7',
                    borderWidth: 1.5,
                    borderColor: isSelected ? Colors.brand.darkPink : 'transparent',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                    <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 17,
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? Colors.brand.darkPink : '#1C1C1E',
                    }}>
                      {lang.label}
                    </Text>
                    {lang.code !== 'en' && (
                      <Text style={{
                        fontSize: 13,
                        color: isSelected ? Colors.brand.darkPink : '#8E8E93',
                        marginTop: 2,
                        opacity: isSelected ? 0.8 : 1
                      }}>
                        {lang.secondary}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={Colors.brand.darkPink} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}
