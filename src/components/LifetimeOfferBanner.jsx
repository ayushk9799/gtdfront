import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Purchases from 'react-native-purchases';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';
import { trackEvent } from '../services/analytics';
import { LIFETIME_OFFER_DURATION_MS } from '../services/lifetimeOffer';

const LIFETIME_OFFERING_ID = 'lifetime_offer';
const REGULAR_OFFERING_ID = 'main_product';

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getLifetimePackage(offering, allowFallback = true) {
  if (offering?.lifetime) return offering.lifetime;

  const packages = offering?.availablePackages || [];
  return packages.find(pkg => (
    pkg?.packageType === 'LIFETIME'
    || pkg?.identifier === '$rc_lifetime'
    || String(pkg?.product?.identifier || '').toLowerCase().includes('lifetime')
  )) || (allowFallback ? packages[0] : null) || null;
}

export default function LifetimeOfferBanner({ visible, onDismiss, onExpired, offerStartTime }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const { height } = useWindowDimensions();
  const bottomSheetRef = useRef(null);
  const hasPresentedRef = useRef(false);
  const shownTrackedRef = useRef(false);
  const loadingOfferingRef = useRef(false);
  const [lifetimePackage, setLifetimePackage] = useState(null);
  const [regularLifetimePackage, setRegularLifetimePackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [remaining, setRemaining] = useState(LIFETIME_OFFER_DURATION_MS);

  const sheetMaxHeight = Math.min(height * 0.84, 740);
  const offerPrice = lifetimePackage?.product?.priceString || '';
  const regularPrice = regularLifetimePackage?.product?.priceString || '';
  const discountPercentage = useMemo(() => {
    const offerAmount = Number(lifetimePackage?.product?.price);
    const regularAmount = Number(regularLifetimePackage?.product?.price);
    const offerCurrency = lifetimePackage?.product?.currencyCode;
    const regularCurrency = regularLifetimePackage?.product?.currencyCode;

    if (
      !Number.isFinite(offerAmount)
      || !Number.isFinite(regularAmount)
      || regularAmount <= 0
      || offerAmount >= regularAmount
      || (offerCurrency && regularCurrency && offerCurrency !== regularCurrency)
    ) {
      return null;
    }

    return Math.round(((regularAmount - offerAmount) / regularAmount) * 100);
  }, [lifetimePackage, regularLifetimePackage]);
  const savingsPrice = useMemo(() => {
    if (!discountPercentage) return '';

    const offerAmount = Number(lifetimePackage?.product?.price);
    const regularAmount = Number(regularLifetimePackage?.product?.price);
    const currency = lifetimePackage?.product?.currencyCode;
    if (!Number.isFinite(offerAmount) || !Number.isFinite(regularAmount) || !currency) return '';

    try {
      return new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language || 'en', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(regularAmount - offerAmount);
    } catch (_) {
      return '';
    }
  }, [discountPercentage, i18n.language, i18n.resolvedLanguage, lifetimePackage, regularLifetimePackage]);

  useEffect(() => {
    if (!visible || !offerStartTime) return undefined;

    const tick = () => {
      const left = Math.max(
        LIFETIME_OFFER_DURATION_MS - (Date.now() - offerStartTime),
        0,
      );
      setRemaining(left);
      if (left <= 0) {
        trackEvent('lifetime_offer_expired', {
          surface: 'lifetime_offer_bottom_sheet',
        });
        onExpired?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [offerStartTime, onExpired, visible]);

  useEffect(() => {
    if (!visible || lifetimePackage || loadingOfferingRef.current || loadFailed) return undefined;

    let cancelled = false;
    const fetchOffer = async () => {
      loadingOfferingRef.current = true;
      try {
        const offerings = await Purchases.getOfferings();
        const offerPackage = getLifetimePackage(offerings?.all?.[LIFETIME_OFFERING_ID]);
        const regularPackage = getLifetimePackage(offerings?.all?.[REGULAR_OFFERING_ID], false);

        if (!cancelled) {
          if (offerPackage) {
            setLifetimePackage(offerPackage);
            setRegularLifetimePackage(regularPackage);
          } else {
            setLoadFailed(true);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to fetch lifetime offering', error);
          setLoadFailed(true);
        }
      } finally {
        loadingOfferingRef.current = false;
      }
    };

    fetchOffer();
    return () => {
      cancelled = true;
    };
  }, [lifetimePackage, loadFailed, visible]);

  useEffect(() => {
    if (!visible) {
      shownTrackedRef.current = false;
      if (hasPresentedRef.current) {
        bottomSheetRef.current?.dismiss();
      }
      return undefined;
    }

    const animationFrame = requestAnimationFrame(() => {
      hasPresentedRef.current = true;
      bottomSheetRef.current?.present();
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [visible]);

  useEffect(() => {
    if (!visible || !lifetimePackage || shownTrackedRef.current) return;

    trackEvent('lifetime_offer_shown', {
      surface: 'lifetime_offer_bottom_sheet',
      package_id: lifetimePackage?.identifier,
      product_id: lifetimePackage?.product?.identifier,
      seconds_remaining: Math.floor(remaining / 1000),
    });
    shownTrackedRef.current = true;
  }, [lifetimePackage, remaining, visible]);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => subscription.remove();
  }, [closeSheet, visible]);

  const handleSheetDismiss = useCallback(() => {
    hasPresentedRef.current = false;
    if (!visible) return;

    trackEvent('lifetime_offer_dismissed', {
      surface: 'lifetime_offer_bottom_sheet',
      package_id: lifetimePackage?.identifier,
      product_id: lifetimePackage?.product?.identifier,
      seconds_remaining: Math.floor(remaining / 1000),
    });
    onDismiss?.();
  }, [lifetimePackage, onDismiss, remaining, visible]);

  const syncServerPremium = async customerInfo => {
    try {
      const active = customerInfo?.entitlements?.active || {};
      const activeList = Object.values(active);
      const hasActive = activeList.length > 0;
      let premiumExpiresAt = null;
      let premiumPlan = null;

      if (hasActive) {
        const maxDate = activeList.reduce((acc, entitlement) => {
          const date = entitlement?.expirationDate
            ? new Date(entitlement.expirationDate)
            : null;
          if (!date) return acc;
          return !acc || date > acc ? date : acc;
        }, null);
        premiumExpiresAt = maxDate ? maxDate.toISOString() : null;
        premiumPlan = activeList[0]?.productIdentifier || 'lifetime';
      }

      const uid = userData?.userId || userData?._id || userData?.id;
      if (!uid) return;
      await dispatch(updateUser({
        userId: uid,
        userData: {
          isPremium: hasActive,
          premiumExpiresAt: hasActive ? premiumExpiresAt : null,
          premiumPlan: hasActive ? premiumPlan : null,
        },
      }));
    } catch (error) {
      // CustomerInfo remains the local source of truth if server sync fails.
    }
  };

  const handlePurchase = async () => {
    if (!lifetimePackage || loading) return;

    try {
      setLoading(true);
      trackEvent('lifetime_offer_purchase_started', {
        surface: 'lifetime_offer_bottom_sheet',
        package_id: lifetimePackage?.identifier,
        product_id: lifetimePackage?.product?.identifier,
        seconds_remaining: Math.floor(remaining / 1000),
      });

      const latestOfferings = await Purchases.getOfferings();
      if (!latestOfferings?.all?.[LIFETIME_OFFERING_ID]) {
        trackEvent('lifetime_offer_expired', {
          surface: 'lifetime_offer_bottom_sheet',
          package_id: lifetimePackage?.identifier,
          product_id: lifetimePackage?.product?.identifier,
        });
        Alert.alert(t('lifetime.expiredTitle'), t('lifetime.expiredMsg'));
        closeSheet();
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
      dispatch(setCustomerInfo(customerInfo));
      await syncServerPremium(customerInfo);
      trackEvent('lifetime_offer_purchase_success', {
        surface: 'lifetime_offer_bottom_sheet',
        package_id: lifetimePackage?.identifier,
        product_id: lifetimePackage?.product?.identifier,
      });

      Alert.alert(
        t('lifetime.welcomeTitle'),
        t('lifetime.welcomeMsg'),
        [{ text: t('lifetime.startExploring'), onPress: closeSheet }],
      );
    } catch (error) {
      if (error?.userCancelled) {
        trackEvent('lifetime_offer_purchase_cancelled', {
          surface: 'lifetime_offer_bottom_sheet',
          package_id: lifetimePackage?.identifier,
          product_id: lifetimePackage?.product?.identifier,
        });
        if (Platform.OS === 'android') {
          ToastAndroid.show(t('lifetime.purchaseCancelled'), ToastAndroid.SHORT);
        } else {
          Alert.alert(t('lifetime.purchaseCancelled'));
        }
      } else {
        trackEvent('lifetime_offer_purchase_failed', {
          surface: 'lifetime_offer_bottom_sheet',
          package_id: lifetimePackage?.identifier,
          product_id: lifetimePackage?.product?.identifier,
        });
        Alert.alert(t('lifetime.purchaseError'), t('lifetime.purchaseErrorMsg'));
      }
    } finally {
      setLoading(false);
    }
  };

  const retryOffering = () => {
    setLoadFailed(false);
    setLifetimePackage(null);
    setRegularLifetimePackage(null);
  };

  const renderBackdrop = useCallback(backdropProps => (
    <BottomSheetBackdrop
      {...backdropProps}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.52}
      pressBehavior="none"
    />
  ), []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      enablePanDownToClose
      maxDynamicContentSize={sheetMaxHeight}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBackground}
      handleComponent={null}
      onDismiss={handleSheetDismiss}
    >
      <SafeAreaView edges={['bottom']} style={s.safeArea}>
      <LinearGradient
        pointerEvents="none"
        colors={['#FFF3F7', '#FFFFFF', '#FFF8FA']}
        locations={[0, 0.56, 1]}
        style={s.sheetGradient}
      />

      <View style={s.handle} />
      {discountPercentage ? (
        <View style={s.topDiscountBadge}>
          <Text style={s.topDiscountText}>
            {t('lifetime.percentOff', { percentage: discountPercentage })}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        activeOpacity={0.8}
        onPress={closeSheet}
        style={s.closeButton}
      >
        <MaterialCommunityIcons name="close" size={22} color="#B51D55" />
      </TouchableOpacity>

      <BottomSheetView style={s.content}>
        <View style={s.animationWrap}>
          <View style={s.pinkGlow} />
          <LottieView
            source={require('../../assets/box-offer.lottie')}
            autoPlay
            loop
            resizeMode="contain"
            style={s.lottie}
          />
          <View style={[s.sparkle, s.sparkleLeft]} />
          <View style={[s.sparkle, s.sparkleRight]} />
        </View>

        <View style={s.badge}>
          <MaterialCommunityIcons name="lightning-bolt" size={12} color="#B51D55" />
          <Text style={s.badgeText}>{t('lifetime.badge')}</Text>
        </View>

        <Text style={s.title}>{t('lifetime.title')}</Text>
        <Text style={s.subtitle}>{t('lifetime.subtitle')}</Text>

        {loadFailed ? (
          <View style={s.offerStatusCard}>
            <Text style={s.offerStatusTitle}>{t('lifetime.purchaseError')}</Text>
            <Text style={s.offerStatusText}>{t('lifetime.purchaseErrorMsg')}</Text>
            <TouchableOpacity onPress={retryOffering} style={s.retryButton}>
              <Text style={s.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : lifetimePackage ? (
          <View style={[s.priceSection, discountPercentage && s.priceSectionWithSavings]}>
            {discountPercentage ? (
              <View style={s.savingsPill}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  numberOfLines={1}
                  style={s.savingsText}
                >
                  {savingsPrice
                    ? t('lifetime.saveAmountOnly', { amount: savingsPrice })
                    : t('lifetime.savePercent', { percentage: discountPercentage })}
                </Text>
              </View>
            ) : null}
            {discountPercentage && regularPrice ? (
              <View style={s.regularPriceRow}>
                <Text style={s.priceLabel}>{t('lifetime.regularPrice')}</Text>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={s.regularPrice}
                >
                  {regularPrice}
                </Text>
              </View>
            ) : null}
            <Text style={s.todayPriceLabel}>{t('lifetime.todayPrice')}</Text>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              numberOfLines={1}
              style={s.offerPrice}
            >
              {offerPrice}
            </Text>
            <Text style={s.priceNote}>{t('lifetime.foreverAccess')}</Text>
          </View>
        ) : (
          <View style={s.offerStatusCard}>
            <ActivityIndicator size="small" color="#D72566" />
            <Text style={s.loadingText}>{t('common.loading')}</Text>
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.88}
          disabled={loading || !lifetimePackage || loadFailed}
          onPress={handlePurchase}
          style={[
            s.ctaButton,
            (loading || !lifetimePackage || loadFailed) && s.disabled,
          ]}
        >
          <LinearGradient
            colors={['#FF407D', '#D72566']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={s.ctaContent}>
              <Text style={s.ctaText}>{t('lifetime.getPassFor', { price: offerPrice })}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={s.countdownRow}>
          <MaterialCommunityIcons name="clock-outline" size={15} color="#D72566" />
          <Text style={s.countdownLabel}>{t('lifetime.expiresIn')}</Text>
          <Text style={s.countdownValue}>{formatCountdown(remaining)}</Text>
        </View>

      </BottomSheetView>
      </SafeAreaView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetBackground: {
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFF8FA',
    shadowColor: '#47152A',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    marginTop: 12,
    borderRadius: 3,
    backgroundColor: '#DED5D9',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 3,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#FFE7EF',
  },
  topDiscountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 3,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#D72566',
  },
  topDiscountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  animationWrap: {
    width: 190,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkGlow: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: '#FFE3ED',
    shadowColor: '#FF407D',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 3,
  },
  lottie: {
    width: 190,
    height: 190,
  },
  sparkle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFD76A',
  },
  sparkleLeft: {
    left: 4,
    top: 36,
  },
  sparkleRight: {
    right: 5,
    bottom: 25,
    backgroundColor: '#FF407D',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFE7EF',
  },
  badgeText: {
    marginLeft: 5,
    color: '#B51D55',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 9,
    color: '#2E1520',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 300,
    marginTop: 4,
    color: '#75636B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  offerStatusCard: {
    width: '100%',
    minHeight: 76,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1DDE4',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  offerStatusTitle: {
    color: '#2E1520',
    fontSize: 15,
    fontWeight: '800',
  },
  offerStatusText: {
    marginTop: 4,
    color: '#75636B',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 9,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFE7EF',
  },
  retryButtonText: {
    color: '#B51D55',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingText: {
    marginTop: 8,
    color: '#75636B',
    fontSize: 13,
  },
  priceSection: {
    width: '100%',
    marginTop: 13,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F1DDE4',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  priceSectionWithSavings: {
    marginTop: 26,
    paddingTop: 20,
  },
  regularPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: {
    marginRight: 7,
    color: '#75636B',
    fontSize: 12,
    fontWeight: '600',
  },
  regularPrice: {
    flexShrink: 1,
    color: '#A8999F',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  todayPriceLabel: {
    marginTop: 4,
    color: '#B51D55',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  offerPrice: {
    flexShrink: 1,
    color: '#2E1520',
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '900',
  },
  savingsPill: {
    position: 'absolute',
    top: -15,
    right: 16,
    zIndex: 2,
    maxWidth: '58%',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 14,
    backgroundColor: '#D72566',
    shadowColor: '#8F153F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  priceNote: {
    marginTop: 7,
    color: '#75636B',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
    shadowColor: '#D72566',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  disabled: {
    opacity: 0.55,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
  },
  countdownLabel: {
    marginLeft: 5,
    marginRight: 7,
    color: '#75636B',
    fontSize: 11,
    fontWeight: '600',
  },
  countdownValue: {
    color: '#D72566',
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
