import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Image, Animated, Easing, useWindowDimensions, BackHandler } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DecorativeSeparator from '../components/DecorativeSeparator';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Polygon, Path } from "react-native-svg";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTests as setSelectedTestsAction } from '../store/slices/currentGameSlice';
import Sound from 'react-native-sound';
import QuitConfirmationSheet from '../components/QuitConfirmationSheet';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];



// DecorativeSeparator is now a shared component
function MicroscopeSvg({ size = 80, color = '#F79EBD' }) {
  return (
    <Svg height={size} width={size} viewBox="0 0 512 512" fill="none">
      <G fill={color}>
        <Polygon points="189.725,222.712 231.636,261.866 250.511,241.652 263.675,253.948 277.897,238.714 213.912,178.926 213.912,178.934 201.739,167.556 187.503,182.791 199.676,194.161 199.676,194.168 200.66,195.088 181.785,215.287" />
        <Path d="M330.229,182.704c7.259,9.77,18.846,16.132,31.952,16.132c21.973,0,39.798-17.811,39.798-39.798 c0-14.062-7.324-26.416-18.353-33.486l50.82-54.396L421.288,58.86l8.533-9.126L379.963,3.155l-8.525,9.134L358.288,0 L209.497,159.248l76.165,71.157L330.229,182.704z M362.181,144.506c0.797,0,1.57,0.116,2.345,0.238 c0.326,0.058,0.666,0.116,0.984,0.188c6.413,1.512,11.204,7.238,11.204,14.105c0,8.026-6.507,14.533-14.533,14.533 c-6.542,0-12.014-4.357-13.838-10.299c-0.187-0.615-0.34-1.252-0.456-1.897c-0.13-0.767-0.239-1.534-0.239-2.337 C347.649,151.02,354.155,144.506,362.181,144.506z" />
        <Polygon points="226.468,330.076 80.341,289.671 75.289,307.938 221.417,348.336" />
        <Path d="M334.021,444.259c-21.907,9.148-45.913,14.214-71.098,14.214c-18.035,0-35.571-2.591-52.209-7.44 c-23.949,14.127-43.17,35.412-54.627,60.967h245.625C388.236,481.943,364.041,457.785,334.021,444.259z" />
        <Path d="M436.711,273.322c0-34.616-10.161-66.843-27.61-93.932c-5.066,11.652-14.366,21.039-25.938,26.264 c9.06,18.093,14.228,38.451,14.228,60.055c0,74.269-52.26,129.504-116.361,129.504c-41.512,0-72.386-16.125-93.823-44.278 l-89.851-24.839c22.349,70.166,87.998,121.007,165.567,121.007C358.918,447.103,436.711,369.303,436.711,273.322z" />
      </G>
    </Svg>
  );
}

function Section({ title, children }) {
  const colorScheme = useColorScheme();
  const themeColors = Colors.light;
  return (
    <View style={styles.sectionBlock}>
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
          <DecorativeSeparator />
        </View>
        <ScrollView
          style={styles.sectionScroll}
          contentContainerStyle={styles.sectionScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export default function SelectTests() {
  const { width } = Dimensions.get('window');
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useDispatch();
  const selectedTestIds = useSelector((s) => s.currentGame.selectedTestIds);
  const voiceId = useSelector((s) => s.currentGame.voiceId);
  const audioPaused = useSelector((s) => s.currentGame.audioPaused);
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const labSoundRef = useRef(null);
  const tapSoundRef = useRef(null);
  // Track if this screen is focused (to prevent audio from unfocused instances)
  const isFocusedRef = useRef(true);
  const quitSheetRef = useRef(null);

  const caseData = route?.params?.caseData || {};

  // Extract data from the CASES_ARRAY structure (steps[1].data)
  const step2Data = caseData?.steps?.[1]?.data || {};
  const availableTests = step2Data?.availableTests || [];

  const [evaluatedResults, setEvaluatedResults] = useState([]);

  const testsById = useMemo(() => {
    const map = new Map();
    for (const t of availableTests) {
      map.set(t.testId, t);
    }
    return map;
  }, [availableTests]);

  const iconForTest = (t) => {
    if (!t) return 'beaker-outline';
    switch (t.testId) {
      case 'img001':
        return 'heart-pulse';
      case 'img002':
        return 'x-ray';
      case 'img003':
        return 'radiology-box';
      case 'img004':
        return 'image';
      case 'img005':
        return 'image';
      default:
        break;
    }
    if (t.category === 'Imaging/Cardiac') return 'heart-pulse';
    if (t.category === 'Imaging') return 'image';
    if (t.category === 'Laboratory') return 'beaker-outline';
    return 'beaker-outline';
  };

  // Play tap sound
  const playTapSound = useCallback(() => {
    try {
      // Release previous sound if exists
      if (tapSoundRef.current) {
        tapSoundRef.current.release();
      }
      const tapSound = new Sound('tap_sound.wav', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          return;
        }
        tapSound.play((finished) => {
          if (finished) {
            try { tapSound.release(); } catch (_) { }
            if (tapSoundRef.current === tapSound) {
              tapSoundRef.current = null;
            }
          }
        });
      });
      tapSoundRef.current = tapSound;
    } catch (error) {
    }
  }, []);

  const toggleTest = (id) => {
    const isCurrentlySelected = selectedTestIds.includes(id);
    const next = isCurrentlySelected
      ? selectedTestIds.filter((t) => t !== id)
      : [...selectedTestIds, id];
    dispatch(setSelectedTestsAction(next));
    // Play tap sound only when selecting (not deselecting)
    if (!isCurrentlySelected) {
      playTapSound();
    }
  };

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => { try { loop.stop?.(); } catch (_) { } shimmerAnim.setValue(0); };
  }, [shimmerAnim]);

  // Stop lab audio playback
  const stopLabAudio = useCallback(() => {
    try {
      labSoundRef.current?.stop?.();
      labSoundRef.current?.release?.();
    } catch (_) { }
    labSoundRef.current = null;
  }, []);

  // Play lab audio on mount if not paused
  useEffect(() => {
    // Don't play if not focused (prevents unfocused instances from playing)
    if (!isFocusedRef.current) {
      return;
    }

    if (!voiceId || audioPaused) {
      return;
    }

    // Setup sound category
    try { Sound.setCategory('Playback', true); } catch (_) { }
    try { Sound.enableInSilenceMode(true); } catch (_) { }

    // Add delay before playing audio
    const delayTimeout = setTimeout(() => {
      // Double-check focus before playing
      if (!isFocusedRef.current) {
        return;
      }

      const s = new Sound(`lab_${voiceId?.toLowerCase()}.mp3`, Sound.MAIN_BUNDLE, (error) => {
        // Race condition guard: if user closed/navigated away while loading,
        // labSoundRef.current will be null or a different Sound instance
        if (labSoundRef.current !== s) {
          try { s.release(); } catch (_) { }
          return;
        }
        // Also check focus
        if (!isFocusedRef.current) {
          try { s.release(); } catch (_) { }
          labSoundRef.current = null;
          return;
        }
        if (error) {
          try { s.release(); } catch (_) { }
          labSoundRef.current = null;
          return;
        }
        // Play the audio
        s.play((finished) => {
          try { s.release(); } catch (_) { }
          if (labSoundRef.current === s) {
            labSoundRef.current = null;
          }
        });
      });
      labSoundRef.current = s;
    }, 500); // 500ms delay

    return () => {
      clearTimeout(delayTimeout);
      stopLabAudio();
    };
  }, [voiceId, audioPaused, stopLabAudio]);

  // Clean up audio when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen gained focus
      isFocusedRef.current = true;

      return () => {
        // Screen lost focus
        isFocusedRef.current = false;
        stopLabAudio();
        // Clean up tap sound
        try {
          tapSoundRef.current?.stop?.();
          tapSoundRef.current?.release?.();
        } catch (_) { }
        tapSoundRef.current = null;
      };
    }, [stopLabAudio])
  );

  // Handle Android physical back button press - show quit confirmation
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Show the quit confirmation sheet instead of navigating back
        quitSheetRef.current?.present();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  const handleEvaluate = () => {
    const results = selectedTestIds.map((id) => {
      const meta = testsById.get(id);
      const value = meta?.result;
      return { id, name: meta?.testName || id, value };
    });
    setEvaluatedResults(results);
  };

  const reportsSheetRef = useRef(null);
  const reportsScrollRef = useRef(null);
  const [reportIndex, setReportIndex] = useState(0);
  const reportSnapPoints = React.useMemo(() => ['70%', '80%'], []);
  const renderBackdrop = React.useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    []
  );

  const presentReportsSheet = () => {
    if (!selectedTestIds || selectedTestIds.length === 0) return;
    handleEvaluate();
    setReportIndex(0);
    reportsSheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.headerOverlay, { top: 12 + insets.top }]} pointerEvents="box-none">
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            quitSheetRef.current?.present();
          }}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: isTablet ? 24 : 10, paddingTop: 50, paddingBottom: 120 }}>
        <View
          pointerEvents="none"
          style={[
            styles.decorationOverlay,
            { top: 0, right: Math.max(12, insets.right + 12) },
          ]}
        >
          <View style={{ width: 72, height: 72 }}>
            <MicroscopeSvg size={72} />
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,247,250,0.85)", "#FFF7FA"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 32 }}
            />
          </View>
        </View>
        <Section title="Select Tests">
          <View style={styles.testGrid}>
            {availableTests.map((t) => {
              const selected = selectedTestIds.includes(t.testId);
              const icon = iconForTest(t);
              return (
                <TouchableOpacity
                  key={t.testId}
                  accessibilityRole="button"
                  onPress={() => toggleTest(t.testId)}
                  style={[styles.testCard, selected && styles.testCardSelected]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.testName, selected && styles.testNameSelected]}>{t.testName}</Text>
                  {selected ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.darkPink} style={styles.selectedCheck} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[styles.navButton, styles.navLeft, { bottom: Math.max(22, insets.bottom + 25) }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={presentReportsSheet}
          disabled={!selectedTestIds || selectedTestIds.length === 0}
          style={[styles.primaryButton, styles.navRightCta, { bottom: Math.max(22, insets.bottom + 25) }, (!selectedTestIds || selectedTestIds.length === 0) && { opacity: 0.5 }]}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#F472B6", "#FB7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.shimmer, { transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 220] }) }] }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <MaterialCommunityIcons name="file-document" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Get Reports</Text>
        </TouchableOpacity>

        <BottomSheetModal
          ref={reportsSheetRef}
          snapPoints={reportSnapPoints}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          enableContentPanningGesture={false}
          handleIndicatorStyle={{ backgroundColor: '#C8D1DA' }}
          backgroundStyle={{ backgroundColor: '#E8F2FF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <BottomSheetView style={{ padding: 16 }}>
            {evaluatedResults && evaluatedResults.length > 0 ? (
              <>
                <View style={styles.sheetHeaderRow}>
                  <Text style={styles.sheetHeaderTitle}>Reports ({evaluatedResults.length})</Text>
                </View>
                <View style={styles.chipsRow}>
                  {evaluatedResults.map((r, i) => {
                    const testMeta = testsById.get(r.id);
                    const label = testMeta?.testName || r.id;
                    const shortLabel = (label && label.split('(')[0]) || label;
                    const active = i === reportIndex;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => {
                          const pageWidth = width - 32;
                          reportsScrollRef.current?.scrollTo({ x: pageWidth * i, animated: true });
                          setReportIndex(i);
                        }}
                        style={[styles.chip, active && styles.chipActive]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{shortLabel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <GestureScrollView
                  ref={reportsScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const x = e?.nativeEvent?.contentOffset?.x || 0;
                    const pageWidth = width - 32;
                    const i = Math.round(x / pageWidth);
                    if (i !== reportIndex) setReportIndex(i);
                  }}
                  contentContainerStyle={{ alignItems: 'stretch' }}
                  style={{ marginTop: 8 }}
                  nestedScrollEnabled
                  directionalLockEnabled
                >
                  {evaluatedResults.map((r) => {
                    const meta = testsById.get(r.id);
                    const testName = meta?.testName || r.id;
                    return (
                      <View key={r.id} style={{ width: width - 32, paddingRight: 16 }}>
                        <View style={styles.simpleReportCard}>
                          <Text style={styles.reportValueText}>
                            {r?.value || 'Result not available for this test.'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </GestureScrollView>
                <View style={styles.sheetActionsRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => reportsSheetRef.current?.dismiss()}
                    style={styles.secondaryButton}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      stopLabAudio(); // Stop audio before navigating
                      reportsSheetRef.current?.dismiss();
                      navigation.navigate('SelectDiagnosis', { caseData });
                    }}
                    style={[styles.primaryButtonInRow, styles.sheetPrimaryInRow]}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={["#F472B6", "#FB7185"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButtonGradient}
                    />
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.shimmer, { transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 220] }) }] }]}
                    >
                      <LinearGradient
                        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                    <Text style={styles.primaryButtonText}>Give Diagnosis</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.sheetDotsContainer} pointerEvents="none">
                  {evaluatedResults.map((_, d) => (
                    <View key={String(d)} style={[styles.sheetDot, d === reportIndex && styles.sheetDotActive]} />
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ fontWeight: '800' }}>No tests selected.</Text>
            )}
          </BottomSheetView>
        </BottomSheetModal>

        <QuitConfirmationSheet
          ref={quitSheetRef}
          onConfirmQuit={() => {
            stopLabAudio();
            navigation.navigate('Tabs', { screen: 'Home' });
            dispatch(setSelectedTestsAction([]));
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16
  },
  navLeft: { left: 16 },
  navButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  container: { flex: 1, backgroundColor: 'transparent' },
  sectionBlock: { flex: 1, marginBottom: 20, alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#1E88E5',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    width: '100%',
    maxWidth: 700,
    flex: 1,
  },
  sectionHeader: { alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  ecgSvg: { marginTop: 6, marginBottom: 6 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6 },
  separatorLine: { flex: 1, height: 2, borderRadius: 2 },
  sectionScroll: { flex: 1 },
  sectionScrollContent: { paddingBottom: 8 },
  headerOverlay: {
    position: 'absolute',
    top: 12,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.darkPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  testGrid: { flexDirection: 'column', gap: 12 },
  testCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 56,
    backgroundColor: '#fff',
  },
  testCardSelected: { borderColor: Colors.brand.darkPink, backgroundColor: 'rgba(255, 0, 102, 0.08)' },
  testName: { marginTop: 0, marginLeft: 12, textAlign: 'left', fontWeight: '700', flex: 1 },
  testNameSelected: { color: Colors.brand.darkPink },
  selectedCheck: { position: 'absolute', top: 8, right: 8 },
  primaryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    minHeight: 50,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 120, opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  navRightCta: { position: 'absolute', right: 16, paddingHorizontal: 16 },
  // Margin-based button positioning
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  navButtonInFlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryButtonInFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 50,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  // bottom sheet styles
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#11181C' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff' },
  chipActive: { backgroundColor: 'rgba(255, 0, 102, 0.10)', borderColor: Colors.brand.darkPink },
  chipText: { fontSize: 12, fontWeight: '700', color: '#11181C' },
  chipTextActive: { color: Colors.brand.darkPink },
  simpleReportCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#fff', padding: 16, minHeight: 120, justifyContent: 'flex-start' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: Colors.brand.darkPink, flex: 1, flexWrap: 'wrap' },
  reportValueText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: '#333', fontWeight: '800' },
  sheetDotsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  sheetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.12)' },
  sheetDotActive: { backgroundColor: Colors.brand.darkPink },
  sheetActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff' },
  secondaryButtonText: { fontWeight: '800', color: Colors.brand.darkPink },
  sheetPrimaryInRow: { paddingHorizontal: 10 },
  primaryButtonInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sheetHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B', // Slate 800
    letterSpacing: 0.5,
  },

  // Chip Tabs Section
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8, // Adds spacing between chips
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate 200
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#3B82F6', // Blue 500
    borderColor: '#3B82F6',
    shadowOpacity: 0.2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B', // Slate 500
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Report Card Section
  simpleReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reportTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#94A3B8', // Slate 400
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  reportValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    textAlign: 'center',
    lineHeight: 32,
  },

  // Action Buttons Section
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },

  // Primary Button (Diagnosis)
  primaryButtonInRow: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Essential for the gradient/shimmer
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetPrimaryInRow: {
    // Optional specific overrides if needed, currently mapped to primaryButtonInRow
  },
  primaryButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100, // Width of the passing shimmer light
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    zIndex: 1, // Ensure text sits above the shimmer
  },

  // Pagination Dots
  sheetDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 6,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1', // Slate 300
  },
  sheetDotActive: {
    width: 24, // Elongated active dot
    backgroundColor: '#3B82F6', // Blue 500
  },
  decorationOverlay: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 0,
  },
});

