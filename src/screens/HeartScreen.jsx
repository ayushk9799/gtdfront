import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Platform, Share, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { useSelector, useDispatch } from 'react-redux';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import heartImage from '../../constants/heart.png';
import LinearGradient from 'react-native-linear-gradient';
import { MMKV } from 'react-native-mmkv';
import { API_BASE } from '../../constants/Api';

const storage = new MMKV();

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];
const HERO_HEIGHT = 280;
const HERO_GRADIENT_HEIGHT = 120;
const HERO_PLACEHOLDER_HEIGHT = HERO_HEIGHT - 10;

export default function HeartScreen() {
  // Static, presentational values (no calculations)
  const { hearts, userData } = useSelector(state => state.user);
  const referralCode = userData?.referralCode || '';
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const premiumSheetRef = React.useRef(null);
  const MAX_HEARTS_DISPLAY = 2;
  const heartsToShow = Math.min(hearts, MAX_HEARTS_DISPLAY);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [codeApplied, setCodeApplied] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

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

  // Calculate time until next reset (midnight 12:00 AM)
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Set to 12:00 AM

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      };
    };

    // Update immediately
    const updateTimer = () => {
      const time = calculateTimeUntilReset();
      setTimeUntilReset(time.formatted);
    };

    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const onGoPro = () => {
    // navigation.navigate('Premium');
    // dispatch(useHeart());
    premiumSheetRef.current?.present();
  };

  const onShareWithFriend = async () => {
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
    }
  };

  const handleApplyFriendCode = async () => {
    if (!friendCode.trim()) return;

    setIsApplying(true);
    try {
      const userStr = storage.getString('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || user?._id;

      const response = await fetch(`${API_BASE}/api/referral/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: friendCode.trim().toUpperCase(),
          userId
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setCodeApplied(true);
        setFriendCode('');
        Alert.alert('Success!', 'Referral code applied. Your friend received a heart!');
      } else {
        Alert.alert('Oops!', data.message || 'Invalid or already used code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not apply the code. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={SUBTLE_PINK_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Hero Image - Positioned like PremiumScreen */}
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
            paddingTop: insets.top,
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslateY }],
            zIndex: 1,
          }}
        >
          <View style={styles.heartImageContainer}>
            <Image source={heartImage} style={styles.heartImageHero} resizeMode="contain" />
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.4)']}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#FFF7FA']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_GRADIENT_HEIGHT,
            }}
          />
        </Animated.View>

        {/* Header */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 10,
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#2D3142" />
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ flex: 1, zIndex: 2, backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingBottom: 28, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
        >
          <View style={{ height: HERO_PLACEHOLDER_HEIGHT }} />
          <View
            style={{
              backgroundColor: '#FFF7FA',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              marginTop: -24,
              paddingTop: 24,
              paddingBottom: 24,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -2 },
            }}
          >
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={styles.subtitle}>
                <Text style={styles.boldText}>1 Heart = 1 Case</Text>

              </Text>

              <View style={styles.card}>
                <View style={styles.heartsRow}>
                  {Array.from({ length: MAX_HEARTS_DISPLAY }).map((_, idx) => {
                    const filled = idx < heartsToShow;
                    return (
                      <Ionicons
                        key={idx}
                        name="heart"
                        size={44}
                        color={filled ? '#ff4d4f' : '#c8cbd0'}
                        style={styles.heartIcon}
                      />
                    );
                  })}
                </View>
                <View style={styles.cardMainTextContainer}>
                  <Text style={styles.cardMainText}>
                    Today's <Text style={styles.cardMainTextNumber}>{hearts}</Text> {hearts === 1 ? 'Heart' : 'Hearts'} Left
                  </Text>
                </View>
                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={16} color="#65727E" style={{ marginRight: 6 }} />
                  <Text style={styles.timerText}>
                    Hearts reset in: <Text style={styles.timerTime}>{timeUntilReset}</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.subtitleSecondary}>You get 2 hearts every 24 hour.</Text>

              <View style={styles.cardAlt}>
                <Text style={styles.cardAltTitle}>Want to play more today?</Text>

                {/* Premium Option */}
                <View style={styles.optionSection}>
                  <View style={styles.optionHeader}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="diamond" size={20} color="#667eea" />
                    </View>
                    <Text style={styles.optionTitle}>Get Premium</Text>
                  </View>

                  <View style={styles.listRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#02b3a4" style={{ marginRight: 8 }} />
                    <Text style={styles.listText}>
                      Unlock <Text style={{ fontWeight: '700' }}>unlimited Hearts</Text>
                    </Text>
                  </View>

                  <View style={styles.listRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#02b3a4" style={{ marginRight: 8 }} />
                    <Text style={styles.listText}>
                      Access <Text style={{ fontWeight: '700' }}>Clinical Insight</Text>
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.ctaButton} onPress={onGoPro} activeOpacity={0.9}>
                    <Text style={styles.ctaButtonText}>Get Premium →</Text>
                  </TouchableOpacity>
                </View>

                {/* OR Divider */}
                <View style={styles.orDividerContainer}>
                  <View style={styles.orDividerLine} />
                  <View style={styles.orDividerTextContainer}>
                    <Text style={styles.orDividerText}>OR</Text>
                  </View>
                  <View style={styles.orDividerLine} />
                </View>

                {/* Referral Option */}
                <View style={styles.optionSection}>
                  <View style={styles.optionHeader}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#FFF0F0' }]}>
                      <Ionicons name="gift" size={20} color="#ff4d4f" />
                    </View>
                    <Text style={styles.optionTitle}>Refer a Friend</Text>
                    <View style={styles.heartBadge}>
                      <Ionicons name="heart" size={12} color="#ff4d4f" />
                      <Text style={styles.heartBadgeText}>+1</Text>
                    </View>
                  </View>

                  <Text style={styles.referralDescriptionText}>
                    Share your code with friends. When they enter it, you get a free heart!
                  </Text>

                  {/* Referral Code Display */}
                  {referralCode ? (
                    <View style={styles.referralCodeBox}>
                      <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
                      <Text style={styles.referralCodeValue}>{referralCode}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onShareWithFriend}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="share-social" size={18} color="#2D3142" style={{ marginRight: 8 }} />
                    <Text style={styles.secondaryButtonText}>Share Code</Text>
                  </TouchableOpacity>

                  {/* Enter Friend's Code Section */}
                  {!codeApplied && (
                    <View style={styles.enterCodeSection}>
                      <View style={styles.enterCodeDivider} />
                      <Text style={styles.enterCodeLabel}>Have a friend's code?</Text>
                      <View style={styles.enterCodeInputRow}>
                        <TextInput
                          style={styles.enterCodeInput}
                          placeholder="Enter code"
                          placeholderTextColor="#9CA3AF"
                          value={friendCode}
                          onChangeText={setFriendCode}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          style={[
                            styles.applyCodeButton,
                            (!friendCode.trim() || isApplying) && styles.applyCodeButtonDisabled
                          ]}
                          onPress={handleApplyFriendCode}
                          disabled={!friendCode.trim() || isApplying}
                          activeOpacity={0.8}
                        >
                          {isApplying ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.applyCodeButtonText}>Apply</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {codeApplied && (
                    <View style={styles.codeAppliedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.codeAppliedText}>Friend's code applied!</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <PremiumBottomSheet ref={premiumSheetRef} />
          </View>
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brand.darkPink,
  },
  heartImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  heartImageHero: {
    width: 200,
    height: 200,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 32,
    // flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#556070',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.brand.darkPink,
    fontSize: 18,
  },
  subtitleSecondary: {
    textAlign: 'center',
    color: '#65727E',
    fontSize: 14,
    marginBottom: 16,
    marginTop: 6,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDEDED',
    alignItems: 'center',
    width: '100%',
  },
  heartsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  heartIcon: {
    marginHorizontal: 10,
  },
  cardMainTextContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  cardMainText: {
    fontSize: 18,
    color: '#2D3142',
    fontWeight: '700',
  },
  cardMainTextNumber: {
    fontSize: 20,
    color: '#ff4d4f',
    fontWeight: '800',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
  },
  timerText: {
    fontSize: 14,
    color: '#65727E',
    fontWeight: '600',
  },
  timerTime: {
    fontSize: 15,
    color: Colors.brand.darkPink,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardTimerText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#c2c2c2',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cardAlt: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDEDED',
    marginTop: 16,
    width: '100%',
  },
  cardAltTitle: {
    color: Colors.brand.darkPink,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardAltSubtitle: {
    color: '#5B6474',
    fontSize: 15,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listText: {
    flex: 1,
    color: '#2D3142',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDE4DA',
    marginVertical: 8,
  },
  ctaButton: {
    marginTop: 10,
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    marginTop: 10,
    borderColor: '#CBD5E1',
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  // Option Section Styles (for Premium option)
  optionSection: {
    marginTop: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3142',
  },
  // OR Divider Styles
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  orDividerTextContainer: {
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  orDividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  // Heart Badge Styles
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  heartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff4d4f',
    marginLeft: 3,
  },
  // Referral Description Text
  referralDescriptionText: {
    fontSize: 14,
    color: '#5B6474',
    lineHeight: 20,
    marginBottom: 14,
  },
  // Steps Row Styles
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  stepItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B6474',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3142',
    textAlign: 'center',
  },
  // Share CTA Button
  shareCtaButton: {
    flexDirection: 'row',
    marginTop: 4,
    backgroundColor: '#ff4d4f',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCtaButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  // Referral Code Box
  referralCodeBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD6E5',
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  referralCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  referralCodeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff4d4f',
    letterSpacing: 2,
  },
  // Enter Friend's Code Section
  enterCodeSection: {
    marginTop: 16,
  },
  enterCodeDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginBottom: 14,
  },
  enterCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  enterCodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enterCodeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 1,
  },
  applyCodeButton: {
    backgroundColor: Colors.brand.darkPink,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyCodeButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  applyCodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  codeAppliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    gap: 6,
  },
  codeAppliedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});