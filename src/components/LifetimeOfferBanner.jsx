import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  Alert,
  ToastAndroid,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Purchases from 'react-native-purchases';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEATURES = [
  { key: 'unlimitedCases', free: false, pro: true },
  { key: 'dailyChallenge', free: true, pro: true },
  { key: 'pastDailyChallenge', free: false, pro: true },
  { key: 'unlimitedQuizzes', free: false, pro: true },
  { key: 'clinicalImages', free: false, pro: true },
  { key: 'clinicalInsights', free: false, pro: true },
];

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// Format remaining ms to HH:MM:SS
function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function LifetimeOfferBanner({ visible, onDismiss, offerStartTime }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const insets = useSafeAreaInsets();
  const [lifetimePackage, setLifetimePackage] = useState(null);
  const [originalPriceString, setOriginalPriceString] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingOffer, setFetchingOffer] = useState(true);
  const [remaining, setRemaining] = useState(TWO_HOURS_MS);

  // Animation values
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(SCREEN_HEIGHT));

  // Price animation: 'initial' = show original, 'transitioning' = crossfade, 'done' = final
  const [pricePhase, setPricePhase] = useState('initial');
  const [origFade] = useState(() => new Animated.Value(1));
  const [strikeWidth] = useState(() => new Animated.Value(0));
  const [origPriceWidth, setOrigPriceWidth] = useState(0);
  const [finalFade] = useState(() => new Animated.Value(0));
  const [finalScale] = useState(() => new Animated.Value(0.8));

  // Countdown timer
  useEffect(() => {
    if (!visible || !offerStartTime) return;

    const tick = () => {
      const elapsed = Date.now() - offerStartTime;
      const left = Math.max(TWO_HOURS_MS - elapsed, 0);
      setRemaining(left);
      if (left <= 0) {
        onDismiss?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [visible, offerStartTime]);

  // Fetch both offerings from RevenueCat
  useEffect(() => {
    if (!visible) return;

    const fetchOffer = async () => {
      try {
        setFetchingOffer(true);
        const offerings = await Purchases.getOfferings();

        // Get discounted price from lifetime_offer offering
        const lifetimeOffering = offerings?.all?.['lifetime_offer'];
        if (lifetimeOffering?.lifetime) {
          setLifetimePackage(lifetimeOffering.lifetime);
        } else if (lifetimeOffering?.availablePackages?.[0]) {
          setLifetimePackage(lifetimeOffering.availablePackages[0]);
        } else {
          onDismiss?.();
          return;
        }

        // Get original price from default offering's lifetime package
        const defaultOffering = offerings?.current;
        if (defaultOffering?.lifetime) {
          setOriginalPriceString(defaultOffering.lifetime.product?.priceString || null);
        } else if (defaultOffering?.availablePackages) {
          const ltPkg = defaultOffering.availablePackages.find(
            p => p.packageType === 'LIFETIME' || p.identifier === '$rc_lifetime'
          );
          if (ltPkg) {
            setOriginalPriceString(ltPkg.product?.priceString || null);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch lifetime offering', e);
        onDismiss?.();
      } finally {
        setFetchingOffer(false);
      }
    };

    fetchOffer();
  }, [visible]);

  // Animate in when visible
  useEffect(() => {
    if (visible && !fetchingOffer && lifetimePackage) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (originalPriceString) {
          // Wait showing original price
          setTimeout(() => {
            // Draw strikethrough line
            Animated.timing(strikeWidth, {
              toValue: 1,
              duration: 350,
              useNativeDriver: false,
            }).start(() => {
              // Wait briefly before fading out the crossed-out price
              setTimeout(() => {
                setPricePhase('transitioning');
                // Fade out original price
                Animated.timing(origFade, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  // Fade + pop in final price layout
                  Animated.parallel([
                    Animated.timing(finalFade, {
                      toValue: 1,
                      duration: 350,
                      useNativeDriver: true,
                    }),
                    Animated.spring(finalScale, {
                      toValue: 1,
                      tension: 100,
                      friction: 8,
                      useNativeDriver: true,
                    }),
                  ]).start(() => setPricePhase('done'));
                });
              }, 150);
            });
          }, 1200);
        } else {
          setPricePhase('done');
        }
      });
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      setPricePhase('initial');
      origFade.setValue(1);
      strikeWidth.setValue(0);
      finalFade.setValue(0);
      finalScale.setValue(0.8);
    }
  }, [visible, fetchingOffer, lifetimePackage]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, [fadeAnim, slideAnim, onDismiss]);

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
        }
      }));
    } catch (e) {
      // no-op
    }
  };

  const handlePurchase = async () => {
    if (!lifetimePackage || loading) return;
    try {
      setLoading(true);
      
      // Final check: Is the offering still there?
      const checkOfferings = await Purchases.getOfferings();
      if (!checkOfferings.all['lifetime_offer']) {
        Alert.alert(t('lifetime.expiredTitle'), t('lifetime.expiredMsg'));
        handleDismiss();
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
      dispatch(setCustomerInfo(customerInfo));
      await syncServerPremium(customerInfo);
      
      Alert.alert(
        t('lifetime.welcomeTitle'),
        t('lifetime.welcomeMsg'),
        [{ text: t('lifetime.startExploring'), onPress: () => handleDismiss() }]
      );
    } catch (e) {
      if (e?.userCancelled) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(t('lifetime.purchaseCancelled'), ToastAndroid.SHORT);
        } else {
          Alert.alert(t('lifetime.purchaseCancelled'));
        }
      } else {
        Alert.alert(t('lifetime.purchaseError'), t('lifetime.purchaseErrorMsg'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible || fetchingOffer || !lifetimePackage) return null;

  const offerPriceStr = lifetimePackage?.product?.priceString || '';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          s.fullScreen,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Full-screen gradient background */}
        <LinearGradient
          colors={['#1A0A12', '#2D0F1E', '#3D1028', '#2D0F1E', '#1A0A12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Close button */}
        <TouchableOpacity
          style={[s.closeBtn, { top: insets.top + 10 }]}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Badge */}
          <View style={s.badge}>
            <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFD700" />
            <Text style={s.badgeText}>{t('lifetime.badge')}</Text>
          </View>

          {/* Countdown timer */}
          <View style={s.countdownContainer}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#FF6B9D" />
            <Text style={s.countdownLabel}>{t('lifetime.expiresIn')}</Text>
            <Text style={s.countdownTime}>{formatCountdown(remaining)}</Text>
          </View>

          {/* Crown icon */}
          <View style={s.crownCircle}>
            <LinearGradient
              colors={['rgba(255,64,125,0.3)', 'rgba(255,64,125,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <MaterialCommunityIcons name="crown" size={36} color="#FFD700" />
          </View>

          {/* Title */}
          <Text style={s.title}>{t('lifetime.title')}</Text>
          <Text style={s.subtitle}>{t('lifetime.subtitle')}</Text>

          {/* Feature comparison table */}
          <View style={s.tableContainer}>
            {/* Header row */}
            <View style={s.tableHeaderRow}>
              <View style={{ flex: 1 }} />
              <View style={s.tableColHeader}>
                <Text style={s.tableHeaderText}>{t('premium.freeCaps')}</Text>
              </View>
              <View style={s.tableColHeader}>
                <View style={s.proBadge}>
                  <Text style={s.proBadgeText}>{t('premium.proCaps')}</Text>
                </View>
              </View>
            </View>
            {/* Feature rows */}
            {FEATURES.map((f, idx) => (
              <View
                key={f.key}
                style={[
                  s.tableRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.tableLabel}>{t(`premium.${f.key}`)}</Text>
                </View>
                <View style={s.tableColCell}>
                  {f.free ? (
                    <MaterialCommunityIcons name="check" size={18} color="#4CAF50" />
                  ) : (
                    <MaterialCommunityIcons name="minus" size={18} color="rgba(255,255,255,0.2)" />
                  )}
                </View>
                <View style={s.tableColCell}>
                  {f.pro ? (
                    <MaterialCommunityIcons name="check" size={18} color="#00C4B3" />
                  ) : (
                    <MaterialCommunityIcons name="minus" size={18} color="rgba(255,255,255,0.2)" />
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Price section */}
          <View style={s.priceSection}>
            {originalPriceString && pricePhase !== 'done' ? (
              <View style={s.priceAnimContainer}>
                {/* Original price — gets crossed out then fades out */}
                <Animated.View style={{ opacity: origFade, position: 'relative', alignSelf: 'center' }}>
                  <Text
                    style={s.animOrigPrice}
                    onLayout={(e) => setOrigPriceWidth(e.nativeEvent.layout.width)}
                  >
                    {originalPriceString}
                  </Text>
                  {origPriceWidth > 0 && (
                    <Animated.View
                      style={[
                        s.strikeLine,
                        {
                          width: strikeWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, origPriceWidth + 30], // +20 for enough overhang
                          }),
                        },
                      ]}
                    />
                  )}
                </Animated.View>
                {/* Final layout — fades + scales in (overlaid) */}
                <Animated.View
                  style={[
                    s.finalPriceOverlay,
                    {
                      opacity: finalFade,
                      transform: [{ scale: finalScale }],
                    },
                  ]}
                >
                  <Text style={s.strikePrice}>{originalPriceString}</Text>
                  <Text style={s.actualPrice}>{offerPriceStr}</Text>
                </Animated.View>
              </View>
            ) : (
              <View style={s.priceRow}>
                {originalPriceString && (
                  <Text style={s.strikePrice}>{originalPriceString}</Text>
                )}
                <Text style={s.actualPrice}>{offerPriceStr}</Text>
              </View>
            )}
            <Text style={s.priceNote}>{t('lifetime.foreverAccess')}</Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={s.ctaButton}
            activeOpacity={0.85}
            onPress={handlePurchase}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF407D', '#FF1A5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.ctaContent}>
              <MaterialCommunityIcons name="crown" size={18} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={s.ctaText}>
                {loading ? t('lifetime.processing') : t('lifetime.getPass')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Skip link */}
          <TouchableOpacity onPress={handleDismiss} style={s.skipBtn} activeOpacity={0.6}>
            <Text style={s.skipText}>{t('lifetime.maybeLater')}</Text>
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={s.legalContainer}>
            <Text style={s.legalText}>
              {t('premium.footerAgreement').split('<terms>')[0]}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL('https://www.diagnoseit.in/terms')}
              >
                {t('premium.termsOfUse')}
              </Text>
              {t('premium.footerAgreement').split('</terms>')[1]?.split('<privacy>')[0] || ' & '}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL('https://www.diagnoseit.in/privacy')}
              >
                {t('premium.privacyPolicy')}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    marginLeft: 6,
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,64,125,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,64,125,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 18,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 6,
    marginRight: 8,
  },
  countdownTime: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF6B9D',
    fontVariant: ['tabular-nums'],
  },
  crownCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,64,125,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  tableContainer: {
    width: '100%',
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tableColHeader: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
  },
  proBadge: {
    backgroundColor: '#FF407D',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tableLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  tableColCell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  strikePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  actualPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
  },
  ctaButton: {
    width: '100%',
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF407D',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  priceAnimContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    position: 'relative',
  },
  animOrigPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  strikeLine: {
    position: 'absolute',
    top: '50%',
    left: '-5%',
    height: 3,
    backgroundColor: '#FF407D',
    borderRadius: 2,
  },
  finalPriceOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalContainer: {
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legalText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 16,
  },
  legalLink: {
    color: '#FF6B9D',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
