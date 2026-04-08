import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image, Platform, Alert, ToastAndroid, StyleSheet, ScrollView, Linking, BackHandler } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../constants/Colors';
import premiumImage from '../../constants/premium-image.png';
import Purchases from 'react-native-purchases';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';
import { useTranslation, Trans } from 'react-i18next';

const PremiumBottomSheet = forwardRef(function PremiumBottomSheet({ points = [] }, ref) {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { userData } = useSelector(state => state.user);
  const sheetRef = useRef(null);
  const [selectedPlan, setSelectedPlan] = useState(null); // 'weekly' | 'monthly' | 'sixMonth' | 'lifetime'
  const [offerings, setOfferings] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const theme = Colors.light;

  const snapPoints = useMemo(() => ['65%'], []);

  // Handle Android back button when sheet is open
  useEffect(() => {
    if (!isSheetOpen) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      sheetRef.current?.dismiss();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [isSheetOpen]);

  const backdrop = useCallback((props) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
  ), []);

  useImperativeHandle(ref, () => ({
    present: async () => {
      try {
        await getOfferingsAndEntitlements();
      } finally {
        sheetRef.current?.present();
      }
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }), []);

  const syncServerPremium = async (customerInfo) => {
    try {
      const active = customerInfo?.entitlements?.active || {};
      const activeList = Object.values(active || {});
      const hasActive = activeList.length > 0;
      let premiumExpiresAt = null;
      let premiumPlan = null;
      if (hasActive) {
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
      await checkEntitlements();
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
  const isPremium = !!(useSelector(state => state.user).userData?.isPremium || (entitlements && Object.keys(entitlements || {}).length > 0));
  const premiumPlan = useSelector(state => state.user).userData?.premiumPlan || null;
  const premiumExpiresAt = useSelector(state => state.user).userData?.premiumExpiresAt || null;

  const planLabelFromId = (id) => {
    try {
      if (!id) return t('premium.activeSubscription', 'Active subscription');
      const lower = String(id).toLowerCase();
      if (lower.includes('week')) return t('premium.weeklyPlan', 'Weekly Plan');
      if (lower.includes('month')) return t('premium.monthlyPlan', 'Monthly Plan');
      if (lower.includes('year') || lower.includes('annual')) return t('premium.annualPlan', 'Annual Plan');
      if (lower.includes('life')) return t('premium.lifetime', 'Lifetime');
      return t('premium.activeSubscription', 'Active subscription');
    } catch {
      return t('premium.activeSubscription', 'Active subscription');
    }
  };
  const formatDate = (iso) => {
    try {
      if (!iso) return t('account.status', 'Active');
      const d = new Date(iso);
      return d.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return t('account.status', 'Active');
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
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(finalPrice);
    } catch {
      const finalPrice = shouldRound ? roundPriceForDisplay(price) : price;
      return `${currencyCode} ${finalPrice.toFixed(2)}`;
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
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backdropComponent={backdrop}
      enablePanDownToClose={true}
      onChange={(index) => {
        setIsSheetOpen(index >= 0);
        if (index >= 0) {
          // refresh data when opened
          getOfferingsAndEntitlements().catch(() => { });
        }
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={premiumImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', bottom: 12, width: '100%', alignItems: 'center', paddingHorizontal: 16 }}>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.brand.darkPink }}>{t('premium.subscribe')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A4A4A', marginTop: 4, textAlign: 'center' }}>
                  {t('premium.unlimitedAccessDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* Custom Points Section */}
          {points && points.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
              {points.map((point, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 1 }}>
                  <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color={Colors.brand.darkPink} style={{ marginTop: 2 }} />
                  <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 }}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            {isPremium && (
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
            )}
          </View>

          {/* Plan cards (no benefits table here) */}
          {!isPremium && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
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
                  <Text style={{ color: '#6C6C6C' }}>{t('premium.noPackages', 'No packages available')}</Text>
                </View>
              )}
            </View>
          )}

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
                    {loading ? t('premium.processing', 'Processing...') : t('premium.subscribeNow', 'Subscribe Now')}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel anytime */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={{ textAlign: 'center', color: '#4A5564', fontWeight: '700' }}>{t('premium.cancelAnytime', 'Cancel anytime')}</Text>
          </View>

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
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default PremiumBottomSheet;


