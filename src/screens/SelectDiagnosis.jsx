import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DecorativeSeparator from '../components/DecorativeSeparator';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Path, Ellipse } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDiagnosis as setSelectedDiagnosisAction } from '../store/slices/currentGameSlice';
import Sound from 'react-native-sound';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];
const CARD_HEIGHT_PCT = 0.75;
const CARD_HEIGHT_PX = Math.round(Dimensions.get('window').height * CARD_HEIGHT_PCT);

// function ECGUnderline({ color = Colors.brand.darkPink }) {
//   return (
//     <Svg width={160} height={14} viewBox="0 0 160 14" style={styles.ecgSvg}>
//       <Path
//         d="M0 7 H18 L26 7 L31 2 L36 12 L41 7 H58 L66 7 L71 3 L76 12 L81 7 H98 L106 7 L111 3 L116 12 L121 7 H160"
//         stroke={color}
//         strokeWidth={2.5}
//         fill="none"
//         strokeLinejoin="round"
//         strokeLinecap="round"
//       />
//     </Svg>
//   );
// }

// DecorativeSeparator is now a shared component

function DiagnosisSvg({ size = 80, ...props }) {
  return (
    <Svg viewBox="0 0 36 36" width={size} height={size} {...props}>
      <G>
        <Path fill="#E8A6B0" d="M23 34s-2-1-5-1s-5 1-5 1l.999-32h8.002L23 34z" />
        <Path
          fill="#FAD9E0"
          d="M17.978 0h1c2 0 4.001 2 4.001 2s3.227 1.274 6.227 2.274S36.028 22.479 36 23.668c-.022.96-4.746 1.866-4.975 1.263c-.517-1.361-1.718-5.296-2.83-10.804c0 11 2.416 19.707 2.416 19.707S24.978 36 21.978 36c-1-4-.999-17-.999-20S17.978 0 17.978 0z"
        />
        <Path
          fill="#FAD9E0"
          d="M18 0h-1c-2 0-4.001 2-4.001 2S9.772 3.274 6.772 4.274c-3 1-6.821 18.205-6.794 19.394c.022.96 4.746 1.866 4.974 1.263c.517-1.361 1.717-4.993 2.83-10.804c0 11-2.416 19.707-2.416 19.707S11 36 14 36c1-4 .999-17 .999-20S18 0 18 0z"
        />
        <Path
          fill="#FFE6EB"
          d="M24.002 4S21 0 19 0h-2c-2 0-5.002 4-5.002 4l2.001 1l-2.001 1l3.001 10.004h6.002L24.002 6l-2.001-1l2.001-1zM12.18 28.167c-.537.062-2.668-.25-3.084-.458c-.565-.283-.648-.615-.583-1.208c.065-.594.311-1.344.425-3.5c.909.417 2.951.542 4.535.583c0 1.812-.332 3.417-.332 3.417c-.069.549-.424 1.103-.961 1.166zm11.64 0c.537.062 2.667-.25 3.084-.458c.565-.283.648-.615.583-1.208c-.065-.594-.311-1.344-.425-3.5c-.909.417-2.951.542-4.535.583c0 1.812.332 3.417.332 3.417c.069.549.424 1.103.961 1.166z"
        />
        <Ellipse fill="#E75480" cx="23.563" cy="13.813" rx=".354" ry="2.021" />
        <Ellipse fill="#C84771" cx="24.563" cy="13.813" rx=".354" ry="2.021" />
        <Path
          fill="#FFE6EB"
          d="M25.918 16.917c-.39.153-2.209.167-2.709-.042c-.5-.208-.688-.438-.729-1.021c-.042-.583.062-2.854.062-2.854h3.959s.125 1.625.125 3c.001.585-.254.739-.708.917z"
        />
        <Path
          fill="#F5A0B5"
          d="M21.001 3.5h-6.002v-1a2 2 0 0 1 2-2h2.002a2 2 0 0 1 2 2v1z"
        />
        <Path
          fill="#E57A97"
          d="M21.001 31.712h-6.002V3.501a2 2 0 0 1 2-2h2.002a2 2 0 0 1 2 2v28.211z"
        />
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

export default function SelectDiagnosis() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const dispatch = useDispatch();
  const selectedDiagnosisId = useSelector((s) => s.currentGame.selectedDiagnosisId);
  const voiceId = useSelector((s) => s.currentGame.voiceId);
  const audioPaused = useSelector((s) => s.currentGame.audioPaused);
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const diagnosisSoundRef = useRef(null);
  const tapSoundRef = useRef(null);
  // Track if this screen is focused (to prevent audio from unfocused instances)
  const isFocusedRef = useRef(true);

  const caseData = route?.params?.caseData || {};

  // Extract data from the CASES_ARRAY structure (steps[2].data)
  const step3Data = caseData?.steps?.[2]?.data || {};
  const diagnosisOptions = step3Data?.diagnosisOptions || [];

  // Play tap sound
  const playTapSound = useCallback(() => {
    try {
      // Release previous sound if exists
      if (tapSoundRef.current) {
        tapSoundRef.current.release();
      }
      const tapSound = new Sound('tap_sound.wav', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Tap sound load error:', error);
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
      console.log('Tap sound error:', error);
    }
  }, []);

  const toggleDiagnosis = (id) => {
    const isCurrentlySelected = selectedDiagnosisId === id;
    const next = isCurrentlySelected ? null : id;
    dispatch(setSelectedDiagnosisAction(next));
    // Play tap sound only when selecting (not deselecting)
    if (!isCurrentlySelected) {
      playTapSound();
    }
  };

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      try { loop.stop?.(); } catch (_) { }
      shimmerAnim.setValue(0);
    };
  }, [shimmerAnim]);

  // Stop diagnosis audio playback
  const stopDiagnosisAudio = useCallback(() => {
    try {
      diagnosisSoundRef.current?.stop?.();
      diagnosisSoundRef.current?.release?.();
    } catch (_) { }
    diagnosisSoundRef.current = null;
  }, []);

  // Play diagnosis audio on mount if not paused
  useEffect(() => {
    // Don't play if not focused (prevents unfocused instances from playing)
    if (!isFocusedRef.current) {
      console.log('🔇 SelectDiagnosis audio skipped - not focused');
      return;
    }

    if (!voiceId || audioPaused) {
      return;
    }

    console.log('🔊 SelectDiagnosis playing audio | voiceId:', voiceId);

    // Setup sound category
    try { Sound.setCategory('Playback', true); } catch (_) { }
    try { Sound.enableInSilenceMode(true); } catch (_) { }

    // Add delay before playing audio
    const delayTimeout = setTimeout(() => {
      // Double-check focus before playing
      if (!isFocusedRef.current) {
        console.log('🔇 SelectDiagnosis audio timeout skipped - lost focus');
        return;
      }

      const s = new Sound(`diagnosis_${voiceId?.toLowerCase()}.mp3`, Sound.MAIN_BUNDLE, (error) => {
        // Race condition guard
        if (diagnosisSoundRef.current !== s) {
          try { s.release(); } catch (_) { }
          return;
        }
        // Check focus
        if (!isFocusedRef.current) {
          try { s.release(); } catch (_) { }
          diagnosisSoundRef.current = null;
          return;
        }
        if (error) {
          console.log('Diagnosis audio load error:', error);
          try { s.release(); } catch (_) { }
          diagnosisSoundRef.current = null;
          return;
        }
        // Play the audio
        s.play((finished) => {
          try { s.release(); } catch (_) { }
          if (diagnosisSoundRef.current === s) {
            diagnosisSoundRef.current = null;
          }
        });
      });
      diagnosisSoundRef.current = s;
    }, 500); // 500ms delay

    return () => {
      clearTimeout(delayTimeout);
      stopDiagnosisAudio();
    };
  }, [voiceId, audioPaused, stopDiagnosisAudio]);

  // Clean up audio when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen gained focus
      console.log('👁️ SelectDiagnosis FOCUSED');
      isFocusedRef.current = true;

      return () => {
        // Screen lost focus
        console.log('👁️ SelectDiagnosis UNFOCUSED');
        isFocusedRef.current = false;
        stopDiagnosisAudio();
        // Clean up tap sound
        try {
          tapSoundRef.current?.stop?.();
          tapSoundRef.current?.release?.();
        } catch (_) { }
        tapSoundRef.current = null;
      };
    }, [stopDiagnosisAudio])
  );

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
            stopDiagnosisAudio(); // Stop audio before navigating
            navigation.navigate('Tabs', { screen: 'Home' });
          }}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 50, paddingBottom: 120 }}>
        <View
          pointerEvents="none"
          style={[
            styles.decorationOverlay,
            { top: 0, right: Math.max(12, insets.right + 12) },
          ]}
        >
          <View style={{ width: 100, height: 100 }}>
            <DiagnosisSvg size={100} />
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,247,250,0.85)", "#FFF7FA"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}
            />
          </View>
        </View>
        <Section title={`Select Diagnosis`}>
          <View style={{ gap: 12 }}>
            {diagnosisOptions.map((opt) => {
              const selected = selectedDiagnosisId === opt.diagnosisId;
              return (
                <TouchableOpacity
                  key={opt.diagnosisId}
                  accessibilityRole="button"
                  onPress={() => toggleDiagnosis(opt.diagnosisId)}
                  style={[styles.diagnosisCard, selected && styles.diagnosisCardSelected]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.diagnosisName, selected && styles.diagnosisNameSelected]}>
                    {opt.diagnosisName}
                  </Text>
                  {selected ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.darkPink} style={styles.selectedCheck} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={[styles.navButton, styles.navLeft, { bottom: 80 }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          if (!selectedDiagnosisId) return;
          stopDiagnosisAudio(); // Stop audio before navigating
          navigation.navigate('SelectTreatment', { caseData });
        }}
        disabled={!selectedDiagnosisId}
        style={[styles.primaryButton, styles.navRightCta, { bottom: 80 }, !selectedDiagnosisId && { opacity: 0.5 }]}
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
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 220] }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={styles.primaryButtonText}>Give Medication</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  sectionBlock: { marginBottom: 20, alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#1E88E5',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    width: '100%',
    maxWidth: 700,
    height: CARD_HEIGHT_PX,
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
    left: 12,
    right: 12,
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
  diagnosisCard: {
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
  diagnosisCardSelected: { borderColor: Colors.brand.darkPink, backgroundColor: 'rgba(255, 0, 102, 0.08)' },
  diagnosisName: { marginTop: 0, marginLeft: 12, textAlign: 'left', fontWeight: '700', flex: 1 },
  diagnosisNameSelected: { color: Colors.brand.darkPink },
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
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 120,
    opacity: 0.8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  navRightCta: { position: 'absolute', right: 16, paddingHorizontal: 16 },
  decorationOverlay: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 0,
  },
});


