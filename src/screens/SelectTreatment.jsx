import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DecorativeSeparator from '../components/DecorativeSeparator';
import { Colors } from '../../constants/Colors';
import { API_BASE } from '../../constants/Api';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTreatments as setSelectedTreatmentsAction, submitGameplay } from '../store/slices/currentGameSlice';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import medImg from '../../constants/medicine.png';
import surgImg from '../../constants/surgical.png';
import { useHeart } from '../store/slices/userSlice';
import Sound from 'react-native-sound';
import { checkAndRequestReview } from '../services/ratingService';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];
const CARD_HEIGHT_PCT = 0.70;
const CARD_HEIGHT_PX = Math.round(Dimensions.get('window').height * CARD_HEIGHT_PCT);

function ECGUnderline({ color = Colors.brand.darkPink }) {
  return (
    <Svg width={160} height={14} viewBox="0 0 160 14" style={styles.ecgSvg}>
      <Path
        d="M0 7 H18 L26 7 L31 2 L36 12 L41 7 H58 L66 7 L71 3 L76 12 L81 7 H98 L106 7 L111 3 L116 12 L121 7 H160"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Section({ title, children }) {
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
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
          showsVerticalScrollIndicator
          nestedScrollEnabled
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export default function SelectTreatment() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
  const dispatch = useDispatch();
  const { userId, caseId, selectedTreatmentIds, sourceType } = useSelector((s) => s.currentGame);
  const voiceId = useSelector((s) => s.currentGame.voiceId);
  const audioPaused = useSelector((s) => s.currentGame.audioPaused);
  const { isPremium } = useSelector(state => state.user);
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const treatmentSoundRef = useRef(null);
  const tapSoundRef = useRef(null);
  // Track if this screen is focused (to prevent audio from unfocused instances)
  const isFocusedRef = useRef(true);

  const caseData = route?.params?.caseData || {};
  
  const step4Data = caseData?.steps?.[3]?.data || {};
  const treatmentOptions = step4Data?.treatmentOptions || {};
  const medications = treatmentOptions?.medications || [];
  const surgicalInterventional = treatmentOptions?.surgicalInterventional || [];
  const nonSurgical = treatmentOptions?.nonSurgical || [];
  const psychiatric = treatmentOptions?.psychiatric || [];

  // Render categories separately in the UI with subheaders

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
            try { tapSound.release(); } catch (_) {}
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

  const toggleTreatment = (id) => {
    const isCurrentlySelected = selectedTreatmentIds.includes(id);
    const next = isCurrentlySelected
      ? selectedTreatmentIds.filter((t) => t !== id)
      : [...selectedTreatmentIds, id];
    dispatch(setSelectedTreatmentsAction(next));
    // Play tap sound only when selecting (not deselecting)
    if (!isCurrentlySelected) {
      playTapSound();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Medication':
        return 'pill';
      case 'Surgical/Interventional':
        return 'medical-bag';
      case 'Non-Surgical':
        return 'hospital-building';
      case 'Psychiatric':
        return 'brain';
      default:
        return 'medical-bag';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Medication':
        return Colors.brand.darkPink;
      case 'Surgical/Interventional':
        return '#1E88E5';
      case 'Non-Surgical':
        return '#43A047';
      case 'Psychiatric':
        return '#9C27B0';
      default:
        return Colors.brand.darkPink;
    }
  };

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => { try { loop.stop?.(); } catch(_) {} shimmerAnim.setValue(0); };
  }, [shimmerAnim]);

  // Stop treatment audio playback
  const stopTreatmentAudio = useCallback(() => {
    try {
      treatmentSoundRef.current?.stop?.();
      treatmentSoundRef.current?.release?.();
    } catch (_) {}
    treatmentSoundRef.current = null;
  }, []);

  // Play treatment audio on mount if not paused
  useEffect(() => {
    // Don't play if not focused (prevents unfocused instances from playing)
    if (!isFocusedRef.current) {
      console.log('🔇 SelectTreatment audio skipped - not focused');
      return;
    }
    
    if (!voiceId || audioPaused) {
      return;
    }
    
    console.log('🔊 SelectTreatment playing audio | voiceId:', voiceId);
    
    // Setup sound category
    try { Sound.setCategory('Playback', true); } catch (_) {}
    try { Sound.enableInSilenceMode(true); } catch (_) {}

    // Add delay before playing audio
    const delayTimeout = setTimeout(() => {
      // Double-check focus before playing
      if (!isFocusedRef.current) {
        console.log('🔇 SelectTreatment audio timeout skipped - lost focus');
        return;
      }
      
      const s = new Sound(`treatment_${voiceId?.toLowerCase()}.mp3`, Sound.MAIN_BUNDLE, (error) => {
        // Race condition guard
        if (treatmentSoundRef.current !== s) {
          try { s.release(); } catch (_) {}
          return;
        }
        // Check focus
        if (!isFocusedRef.current) {
          try { s.release(); } catch (_) {}
          treatmentSoundRef.current = null;
          return;
        }
        if (error) {
          console.log('Treatment audio load error:', error);
          try { s.release(); } catch (_) {}
          treatmentSoundRef.current = null;
          return;
        }
        // Play the audio
        s.play((finished) => {
          try { s.release(); } catch (_) {}
          if (treatmentSoundRef.current === s) {
            treatmentSoundRef.current = null;
          }
        });
      });
      treatmentSoundRef.current = s;
    }, 500); // 500ms delay

    return () => {
      clearTimeout(delayTimeout);
      stopTreatmentAudio();
    };
  }, [voiceId, audioPaused, stopTreatmentAudio]);

  // Clean up audio when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen gained focus
      console.log('👁️ SelectTreatment FOCUSED');
      isFocusedRef.current = true;
      
      return () => {
        // Screen lost focus
        console.log('👁️ SelectTreatment UNFOCUSED');
        isFocusedRef.current = false;
        stopTreatmentAudio();
        // Clean up tap sound
        try {
          tapSoundRef.current?.stop?.();
          tapSoundRef.current?.release?.();
        } catch (_) {}
        tapSoundRef.current = null;
      };
    }, [stopTreatmentAudio])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
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
            stopTreatmentAudio(); // Stop audio before navigating
            navigation.navigate('Tabs', { screen: 'Home' });
          }}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: Math.max(36, insets.top + 24), paddingBottom: 120 }}>
        <Section title="Select Treatment Plan">
          {[
            { key: 'Medication', items: medications },
            { key: 'Surgical/Interventional', items: surgicalInterventional },
            { key: 'Non-Surgical', items: nonSurgical },
            { key: 'Psychiatric', items: psychiatric },
          ].map(({ key, items }) => (
            items && items.length ? (
              <View key={key} style={{ marginBottom: 16 }}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryHeaderIconWrap}>
                    {key === 'Medication' ? (
                      <Image source={medImg} style={styles.categoryHeaderImage} />
                    ) : key === 'Surgical/Interventional' ? (
                      <Image source={surgImg} style={styles.categoryHeaderImage} />
                    ) : (
                      <MaterialCommunityIcons 
                        name={getCategoryIcon(key)} 
                        size={18} 
                        color={getCategoryColor(key)} 
                      />
                    )}
                  </View>
                  <Text style={[styles.categoryHeaderText, { color: getCategoryColor(key) }]}>{key}</Text>
                </View>
                <View style={{ gap: 12 }}>
                  {items.map((treatment) => {
                    const selected = selectedTreatmentIds.includes(treatment.treatmentId);
                    const categoryIcon = getCategoryIcon(key);
                    const categoryColor = getCategoryColor(key);
                    return (
                      <TouchableOpacity
                        key={treatment.treatmentId}
                        accessibilityRole="button"
                        onPress={() => toggleTreatment(treatment.treatmentId)}
                        style={[styles.treatmentCard, selected && styles.treatmentCardSelected]}
                        activeOpacity={0.9}
                      >
                        <View style={styles.treatmentContent}>
                          <View style={styles.treatmentHeader}>
                           
                            <View style={styles.treatmentTextContainer}>
                              <Text style={[styles.treatmentName, selected && styles.treatmentNameSelected]}>
                                {treatment.treatmentName}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {selected ? (
                          <MaterialCommunityIcons 
                            name="check-circle" 
                            size={20} 
                            color={Colors.brand.darkPink} 
                            style={styles.selectedCheck} 
                          />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null
          ))}
        </Section>
      </View>

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
        onPress={async () => {
          if (!selectedTreatmentIds || selectedTreatmentIds.length === 0) return;
          stopTreatmentAudio(); // Stop audio before navigating
          try {
            navigation.navigate('ClinicalInsight', { caseData, initialTab: 'Treatment Plan' });

            await dispatch(submitGameplay());
            
            // Request in-app review after first case completion
            // This will only trigger once (after the first game)
            checkAndRequestReview();
          } catch (e) {}
          if(!isPremium && sourceType === 'case') {
            dispatch(useHeart());
          }
        }}
        disabled={!selectedTreatmentIds || selectedTreatmentIds.length === 0}
        style={[
          styles.primaryButton, 
          styles.navRightCta, 
          { bottom: Math.max(22, insets.bottom + 25) }, 
          (!selectedTreatmentIds || selectedTreatmentIds.length === 0) && { opacity: 0.5 }
        ]}
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
          style={[styles.shimmer, { transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0,1], outputRange: [-100, 220] }) }] }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={styles.primaryButtonText}>Confirm Treatment</Text>
        <MaterialCommunityIcons name="check" size={18} color="#fff" />
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
  container: { flex: 1, backgroundColor: 'transparent' },
  sectionBlock: { marginBottom: 20, alignItems: 'center' },
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
  treatmentCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    backgroundColor: '#fff',
  },
  treatmentCardSelected: { 
    borderColor: Colors.brand.darkPink, 
    backgroundColor: 'rgba(255, 0, 102, 0.08)' 
  },
  treatmentContent: {
    flex: 1,
    gap: 8,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  treatmentTextContainer: {
    flex: 1,
    gap: 6,
  },
  treatmentName: { 
    fontSize: 15,
    fontWeight: '700',
    color: '#11181C',
    lineHeight: 20,
  },
  treatmentNameSelected: { 
    color: Colors.brand.darkPink 
  },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryHeaderIconWrap: { width: 26, height: 26, borderRadius: 13,  alignItems: 'center', justifyContent: 'center' },
  categoryHeaderImage: { width: 40, height: 40, resizeMode: 'contain' },
  categoryHeaderText: { fontSize: 16, fontWeight: '900' },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectedCheck: { 
    marginTop: 2,
  },
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
  navRightCta: { 
    position: 'absolute', 
    right: 16, 
    paddingHorizontal: 16 
  },
});

