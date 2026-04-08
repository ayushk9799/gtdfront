import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image, Platform, Alert, ToastAndroid, Animated, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/Colors';
import premiumImage from '../../constants/premium-image.png';
import Purchases from 'react-native-purchases';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation, Trans } from 'react-i18next';

const HERO_HEIGHT = 320;
const HERO_GRADIENT_HEIGHT = 180;
const HERO_PLACEHOLDER_HEIGHT = HERO_HEIGHT - 10;

export default function PremiumScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const [selectedPlan, setSelectedPlan] = useState(null); // 'weekly' | 'monthly' | 'sixMonth' | 'lifetime'
  const [offerings, setOfferings] = useState(null);
  const [entitlements, setEntitlements] = useState(null);

  const [loading, setLoading] = useState(false);
  const theme = Colors.light;
  const { t, i18n } = useTranslation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const heroTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, HERO_HEIGHT],
        outputRange: [0, -40],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const features = useMemo(
    () => [
      { label: t('premium.unlimitedCases'), free: '2', pro: true },
      { label: t('premium.dailyChallenge'), free: '2', pro: true },
      { label: t('premium.unlimitedQuizzes'), free: false, pro: true },
      { label: t('premium.clinicalImages'), free: false, pro: true },
      { label: t('premium.clinicalInsights'), free: false, pro: true },
    ],
    [t],
  );

  // useEffect(() => {
  //   getOfferingsAndEntitlements();
  // }, []);
  useFocusEffect(
    React.useCallback(() => {
      getOfferingsAndEntitlements();
    }, [])
  );

  const syncServerPremium = async (customerInfo) => {
    try {
      const active = customerInfo?.entitlements?.active || {};
      const activeList = Object.values(active || {});
      const hasActive = activeList.length > 0;
      let premiumExpiresAt = null;
      let premiumPlan = null;
      if (hasActive) {
        // Pick the farthest expiration among active entitlements (subscriptions)
        const maxDate = activeList.reduce((acc, e) => {
          const d = e?.expirationDate ? new Date(e.expirationDate) : null;
          if (!d) return acc;
          if (!acc) return d;
          return d > acc ? d : acc;
        }, null);
        premiumExpiresAt = maxDate ? maxDate.toISOString() : null;
        premiumPlan = activeList[0]?.productIdentifier || selectedPlan || null;
      }
      const uid = userData?.userId || userData?._id || userData?.id;
      if (!uid) return;
      await dispatch(updateUser({
        userId: uid,
        userData: {
          isPremium: hasActive,
          premiumExpiresAt: hasActive ? premiumExpiresAt : null,
          premiumPlan: hasActive ? premiumPlan : null,
        }
      }));
    } catch (e) {
    }
  };

  const checkEntitlements = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      dispatch(setCustomerInfo(customerInfo));
      setEntitlements(customerInfo.entitlements.active);
      await syncServerPremium(customerInfo);
    } catch (e) {
    }
  };

  const handlePurchase = async (pkg) => {
    try {
      setLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      dispatch(setCustomerInfo(customerInfo));
      await checkEntitlements(); // Update entitlements after successful purchase
    } catch (e) {
      if (e?.userCancelled) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Purchase cancelled', ToastAndroid.SHORT);
        } else {
          Alert.alert('Purchase cancelled');
        }
      } else {
      }
      return;
    } finally {
      setLoading(false);
    }
  };

  const getOfferingsAndEntitlements = async () => {

    try {
      setLoading(true);
      const o = await Purchases.getOfferings();
      if (o?.current && Array.isArray(o.current.availablePackages) && o.current.availablePackages.length > 0) {
        setOfferings(o);
        // pick default: prefer lifetime, else sixMonth, else monthly
        if (o.current.lifetime) {
          setSelectedPlan(o.current.lifetime.identifier);
        } else if (o.current.sixMonth) {
          setSelectedPlan(o.current.sixMonth.identifier);
        } else if (o.current.monthly) {
          setSelectedPlan(o.current.monthly.identifier);
        } else if (o.current.weekly) {
          setSelectedPlan(o.current.weekly.identifier);
        } else if (o.current.availablePackages.length > 0) {
          setSelectedPlan(o.current.availablePackages[0].identifier);
        } else {
          setSelectedPlan(null);
        }
      } else {
        setOfferings(null);
        setSelectedPlan(null);
      }
      await checkEntitlements();
    } catch (e) {
      setOfferings(null);
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = offerings?.current?.availablePackages?.find(pkg => pkg.identifier === selectedPlan) || null;
  const isPremium = !!(userData?.isPremium || (entitlements && Object.keys(entitlements || {}).length > 0));
  const premiumPlan = userData?.premiumPlan || null;
  const premiumExpiresAt = userData?.premiumExpiresAt || null;
  const planLabelFromId = (id) => {
    try {
      if (!id) return 'Active subscription';
      const lower = String(id).toLowerCase();
      if (lower.includes('week')) return 'Weekly Plan';
      if (lower.includes('month')) return 'Monthly Plan';
      if (lower.includes('year') || lower.includes('annual')) return 'Annual Plan';
      if (lower.includes('life')) return t('premium.lifetime');
      return t('premium.activeSubscription');
    } catch {
      return t('premium.activeSubscription');
    }
  };
  const formatDate = (iso) => {
    try {
      if (!iso) return t('account.status');
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Active';
    }
  };

  // Round price for display:
  // - Small prices (<100): end in .99 (e.g., $14.99)
  // - Large prices (>=100): round up, end in .00 (e.g., ₹1499.00)
  const roundPriceForDisplay = (price) => {
    if (price < 100) {
      return Math.floor(price) + 0.99;
    } else {
      return Math.ceil(price);
    }
  };

  // Helper to format price with currency symbol
  const formatCurrencyPrice = (price, currencyCode, shouldRound = false) => {
    try {
      if (!price || !currencyCode) return '';
      const finalPrice = shouldRound ? roundPriceForDisplay(price) : price;
      // Use i18n.language for locale or undefined for device default
      // narrowSymbol: use "$" instead of "US$", "₹" instead of "INR", etc.
      return new Intl.NumberFormat(i18n.language || undefined, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: finalPrice % 1 === 0 ? 0 : 2, // No decimals if whole number
        maximumFractionDigits: 2,
      }).format(finalPrice);
    } catch {
      const finalPrice = shouldRound ? roundPriceForDisplay(price) : price;
      // Better looking fallback
      const fmtPrice = finalPrice.toFixed(finalPrice % 1 === 0 ? 0 : 2);
      return `${currencyCode} ${fmtPrice}`;
    }
  };

  // Calculate strikethrough price dynamically
  const getStrikethroughPrice = (pkg) => {
    if (!pkg?.product?.price || !pkg?.product?.currencyCode) return null;
    const price = pkg.product.price;
    const originalPrice = price * 2.0; // 100% higher as "original" price
    return formatCurrencyPrice(originalPrice, pkg.product.currencyCode, true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HERO_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }],
            zIndex: 1,
          }}
        >
          <Image source={premiumImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.4)']}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#FFFFFF']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_GRADIENT_HEIGHT,
            }}
          />
          <View style={{ position: 'absolute', bottom: 75, width: '100%', alignItems: 'center', paddingHorizontal: 24 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                paddingVertical: 7,
                paddingHorizontal: 20,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.brand.darkPink }}>{t('premium.subscribe')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#4A4A4A', marginTop: 4, textAlign: 'center' }}>
                {t('premium.unlimitedAccessDesc')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Header */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            zIndex: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E8E8E8',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
              marginRight: 6,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#222222" />
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ flex: 1, zIndex: 2, backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
        >
          <View style={{ height: HERO_PLACEHOLDER_HEIGHT }} />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              marginTop: -62,
              paddingTop: 4,
              paddingBottom: 24,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -2 },
            }}
          >
            {isPremium && (
              <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
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
                      {t('account.youArePremium')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: '#6C6C6C', fontSize: 12, fontWeight: '700' }}>{t('account.plan')}</Text>
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

            {/* Feature comparison table */}
            <View style={{ paddingHorizontal: 16, marginTop: 0 }}>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#EDEDED',
                  overflow: 'hidden',
                }}
              >
                {/* Aligned header row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    backgroundColor: '#FAFAFA',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F2F2F2',
                  }}
                >
                  <View style={{ flex: 1 }} />
                  <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#6C6C6C' }}>{t('premium.freeCaps')}</Text>
                  </View>
                  <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                    <View
                      style={{
                        backgroundColor: Colors.brand.darkPink,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>{t('premium.proCaps')}</Text>
                    </View>
                  </View>
                </View>
                {features.map((f, idx) => (
                  <View
                    key={f.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor: 'transparent',
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: '#F2F2F2',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: '#24323D', fontSize: 14, fontWeight: '700' }}>{f.label}</Text>
                    </View>
                    <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                      {typeof f.free === 'string' ? (
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1E1E' }}>{f.free}</Text>
                      ) : f.free ? (
                        <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                      ) : (
                        <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
                      )}
                    </View>
                    <View style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}>
                      {f.pro ? (
                        <MaterialCommunityIcons name="check" size={20} color="#00C4B3" />
                      ) : (
                        <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Plan cards */}
            {!isPremium && (
              <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
                {offerings?.current?.availablePackages?.length > 0 ? (
                  offerings.current.availablePackages.map((pkg) => {
                    const isSelected = selectedPlan === pkg.identifier;
                    const isLifetime = pkg.identifier === '$rc_lifetime' || pkg.packageType === 'LIFETIME';
                    const isSixMonth = pkg.identifier === '$rc_six_month' || pkg.packageType === 'SIX_MONTH';

                    return (
                      <Pressable
                        key={pkg.identifier}
                        onPress={() => setSelectedPlan(pkg.identifier)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: isSelected ? Colors.brand.darkPink : '#EDEDED',
                          padding: 14,
                          marginBottom: 12,
                        }}
                      >
                        {isLifetime && (
                          <View style={{ position: 'absolute', top: -10, right: 14 }}>
                            <View
                              style={{
                                backgroundColor: '#FFD700',
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                              }}
                            >
                              <Text style={{ color: '#000000', fontWeight: '900', fontSize: 10 }}>{t('premium.oneTimeOnly')}</Text>
                            </View>
                          </View>
                        )}
                        
                        {isSixMonth && (
                          <View style={{ position: 'absolute', top: -10, right: 14 }}>
                            <View
                              style={{
                                backgroundColor: '#4CAF50',
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                              }}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10 }}>{t('premium.bestValue')}</Text>
                            </View>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons
                            name={isSelected ? 'check-circle' : 'circle-outline'}
                            size={22}
                            color={isSelected ? Colors.brand.darkPink : '#B0B7BF'}
                          />
                          <View style={{ marginLeft: 10, flex: 1, paddingRight: isSixMonth ? 10 : 0 }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>{pkg.product.title}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                              {pkg.product.description}
                            </Text>
                            {isSixMonth && pkg.product.pricePerMonthString && (
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#4CAF50', marginTop: 2 }}>
                                {t('premium.only')} {pkg.product.pricePerMonthString}/month
                              </Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                              {pkg.product.priceString}
                            </Text>
                            {getStrikethroughPrice(pkg) && (
                              <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                                {getStrikethroughPrice(pkg)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#6C6C6C' }}>{t('premium.noPackages')}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Subscribe CTA */}
            {!isPremium && (
              <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => selectedPackage && handlePurchase(selectedPackage)}
                  style={{
                    backgroundColor: Colors.brand.darkPink,
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#00C4B3',
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 3,
                    opacity: selectedPackage ? 1 : 0.6,
                  }}
                  disabled={!selectedPackage || loading}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginRight: 6 }}>
                      {loading ? t('premium.processing') : t('premium.subscribeNow')}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Cancel anytime */}
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <Text style={{ textAlign: 'center', color: '#4A5564', fontWeight: '700' }}>{t('premium.cancelAnytime')}</Text>
            </View>

            {/* Terms */}
            <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
              <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                <Trans
                  i18nKey="premium.footerAgreement"
                  components={{
                    terms: (
                      <Text
                        style={{ color: theme.tint, fontWeight: '800', textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL('https://www.diagnoseit.in/terms')}
                      />
                    ),
                    privacy: (
                      <Text
                        style={{ color: theme.tint, fontWeight: '800', textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL('https://www.diagnoseit.in/privacy')}
                      />
                    )
                  }}
                />
              </Text>
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
}