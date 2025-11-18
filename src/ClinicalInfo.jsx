import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DecorativeSeparator from './components/DecorativeSeparator';
import { Colors } from '../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Sound from 'react-native-sound';
import { API_BASE } from '../constants/Api';
import AudioAura from './components/AudioAura';

// Match the app's subtle pink gradient
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

// Card height as a percentage of the screen height
const CARD_HEIGHT_PCT = 0.70;
const CARD_HEIGHT_PX = Math.round(Dimensions.get('window').height * CARD_HEIGHT_PCT);
const AURA_SIZE = 96;


// DecorativeSeparator is now a shared component

function Section({ title, children, onPressAudio, audioPlaying, audioDisabled, audioLoading }) {
  const themeColors =  Colors.light;
  return (
    <View style={styles.sectionBlock}>
      <View style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.border }
      ]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
          {typeof onPressAudio === 'function' ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPressAudio}
              style={styles.audioButton}
              activeOpacity={0.8}
              disabled={audioDisabled || audioLoading}
            >
              <MaterialCommunityIcons
                name={audioLoading ? 'progress-clock' : (audioPlaying ? 'pause' : 'play')}
                size={18}
                color={audioDisabled ? 'rgba(0,0,0,0.25)' : Colors.brand.darkPink}
              />
            </TouchableOpacity>
          ) : null}
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


function BulletItem({ children }) {
  const themeColors =  Colors.light;
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={[styles.bulletText, { color: themeColors.text }]}>{children}</Text>
    </View>
  );
}

function StatTile({ label, value, icon }) {
  const themeColors =  Colors.light;
  return (
    <View style={[styles.statTile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}> 
      <View style={styles.statHeaderRow}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={18} color={Colors.brand.darkPink} style={styles.statIcon} />
        ) : null}
              <Text style={styles.statLabel}>{label}</Text>

      </View>
      <Text style={styles.statValue}>{value}</Text>

    </View>
  );
}

function InfoColumn({ icon, label, value }) {
  return (
    <View style={styles.infoCol}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.brand.darkPink} />
      <Text style={[styles.infoLabel, { color: '#687076' }]}>{label}</Text>
      <Text style={[styles.infoValue, { color:"black"}]}>{value}</Text>
    </View>
  );
}



export default function ClinicalInfo() {
  const { width } = Dimensions.get('window');
  const [index, setIndex] = useState(0);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const SLIDE_COUNT = 4; // Basic, Vitals, Hx, PE

  // Layout calculations for platform-consistent nav button positioning
  const slidePaddingTop = Math.max(36, insets.top + 24);
  const screenHeight = Dimensions.get('window').height;
  const buttonSize = 48;
  const gapBelowCard = 12;
  const desiredTop = slidePaddingTop + CARD_HEIGHT_PX + gapBelowCard;
  const maxTop = screenHeight - insets.bottom - (buttonSize + 8);
  const navButtonTop = Math.min(desiredTop, maxTop);

  const caseDataFromRoute = route?.params?.caseData;
  const caseDataFromStore = useSelector((s) => s.currentGame.caseData);
  const caseData = caseDataFromRoute || caseDataFromStore || {};
  const caseId = (caseData?.caseId && String(caseData.caseId)) || '';
  
  // Extract data from the CASES_ARRAY structure (steps[0].data)
  const step1Data = caseData?.steps?.[0]?.data || {};
  
  const p = step1Data?.basicInfo || {};
  console.log('p', p);
  const chief = step1Data?.chiefComplaint || '';
  const historyItems = step1Data?.history || [];
  const examItems = step1Data?.physicalExamination || [];
  const vitalsData = step1Data?.vitals || {};
  
  // Convert vitals object to array format for display
  const vitalsArray = [
    { name: 'Temperature', value: vitalsData.temperature },
    { name: 'Heart Rate', value: vitalsData.heartRate },
    { name: 'Blood Pressure', value: vitalsData.bloodPressure },
    { name: 'Respiratory Rate', value: vitalsData.respiratoryRate },
    { name: 'O2 Saturation', value: vitalsData.oxygenSaturation }
  ].filter(v => v.value);

  // Normalize vitals ordering to a friendly display
  const vitalsOrder = ['Temperature', 'Heart Rate', 'Blood Pressure', 'Respiratory Rate', 'O2 Saturation', 'Weight'];
  const displayVitals = vitalsOrder
    .map((label) => vitalsArray.find((v) => v.name === label))
    .filter(Boolean);

  const getSlideStyle = (i) => {
    const inputRange = [
      (i - 1) * width,
      i * width,
      (i + 1) * width,
    ];
    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['18deg', '0deg', '-18deg'],
      extrapolate: 'clamp',
    });
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });
    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [24, 0, -24],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });
    return {
      transform: [
        { perspective: 900 },
        { rotateY },
        { scale },
        { translateX },
      ],
      opacity,
    };
  };
  const indexToPart = {
    0: 'basicspeech',
    1: 'vitalsspeech',
    2: 'historyspeech',
    3: 'physicalspeech',
  };
  const urlFor = (id, part) => `${API_BASE}/mp3files/${id}_${part}.mp3`;

  const stopPlayback = () => {
    try {
      soundRef.current?.stop?.();
      soundRef.current?.release?.();
    } catch (_) {}
    soundRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentPart(null);
  };

  const playForIndex = (i) => {
    if (!caseId) return;
    const part = indexToPart[i];
    const url = urlFor(caseId, part);
    console.log('url', url);
    // stop prior if any
    stopPlayback();
    setIsLoading(true);
    try { Sound.setCategory('Playback', true); } catch (_) {}
    try { Sound.enableInSilenceMode(true); } catch (_) {}
    const s = new Sound(url, undefined, (error) => {
      if (error) {
        console.warn('Audio load error:', error);
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentPart(null);
        return;
      }
      setIsLoading(false);
      setIsPlaying(true);
      setCurrentPart(part);
      s.play(() => {
        try { s.release(); } catch (_) {}
        soundRef.current = null;
        setIsPlaying(false);
        setCurrentPart(null);
      });
    });
    soundRef.current = s;
  };

  const togglePlayForIndex = (i) => {
    const part = indexToPart[i];
    console.log('part', part);
    console.log(currentPart);
    console.log(isPlaying);
    if (isPlaying && currentPart === part) {
      stopPlayback();
    } else {
      playForIndex(i);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopPlayback();
      };
    }, [])
  );

  React.useEffect(() => {
    // Autoplay the audio for the active slide; stop anything currently playing
    if (!caseId) {
      stopPlayback();
      return;
    }
    playForIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, caseId]);
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Animated.Easing ? Animated.Easing.linear : undefined,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      try { loop.stop?.(); } catch (_) {}
      shimmerAnim.setValue(0);
    };
  }, [shimmerAnim]);
  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.auraOverlay,
          {
            top: Math.max(
              6,
              12 + insets.top + (36 - AURA_SIZE) / 2 // align vertically with close button
            ),
          },
        ]}
        pointerEvents="box-none"
      >
        <AudioAura
          isPlaying={isPlaying}
          size={AURA_SIZE}
          onPress={() => togglePlayForIndex(index)}
          disabled={!caseId}
        />
      </View>
      <View style={[styles.headerOverlay, { top: 12 + insets.top }]} pointerEvents="box-none">
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Animated.ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const x = e?.nativeEvent?.contentOffset?.x || 0;
          const i = Math.round(x / width);
          if (i !== index) setIndex(i);
        }}
        contentContainerStyle={[styles.carousel, { width: width * SLIDE_COUNT }]}
      >
        <Animated.View style={[styles.slide, { width, paddingTop: Math.max(36, insets.top + 24) }, getSlideStyle(0)]}>
          <Section
            title="Basic Info & Chief Complaint"
          >
            <Image source={require('../constants/inappicon.png')} style={styles.heroImage} />
            <View style={styles.infoGrid}>
              <InfoColumn icon="badge-account" label="Name" value={p?.name || '—'} />
              <InfoColumn icon="gender-male-female" label="Sex" value={p?.gender || '—'} />
              <InfoColumn icon="calendar" label="Age" value={p?.age != null ? String(p.age) : '—'} />
            </View>
            <View style={styles.chiefContainer}>
              <View style={styles.subHeaderRow}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={Colors.brand.darkPink} />
                <Text style={styles.subHeaderText}>Chief Complaint</Text>
              </View>
              <Text style={styles.chiefText}>{chief || '—'}</Text>
            </View>
          </Section>
        </Animated.View>
        <Animated.View style={[styles.slide, { width, paddingTop: Math.max(36, insets.top + 24) }, getSlideStyle(1)]}>
          <Section
            title="Vitals"
          >
            <View style={styles.statsRow}>
              {displayVitals.map((v) => (
                <StatTile
                  key={v.name}
                  icon={
                    v.name === 'Temperature' ? 'thermometer' :
                    v.name === 'Heart Rate' ? 'heart' :
                    v.name === 'Blood Pressure' ? 'blood-bag' :
                    v.name === 'Respiratory Rate' ? 'lungs' :
                    v.name?.includes('O2') ? 'oxygen-tank' : 'dots-horizontal'
                  }
                  label={v.name}
                  value={v.value}
                />
              ))}
            </View>
          </Section>
        </Animated.View>
        <Animated.View style={[styles.slide, { width, paddingTop: Math.max(36, insets.top + 24) }, getSlideStyle(2)]}>
          <Section
            title="History (Hx)"
          >
            {historyItems.map((h, i) => (
              <View key={i} style={styles.historySection}>
                <Text style={[styles.historyCategory, { color: "#C2185B" }]}>{h.category}</Text>
                <BulletItem>{h.detail}</BulletItem>
              </View>
            ))}
          </Section>
        </Animated.View>
        <Animated.View style={[styles.slide, { width, paddingTop: Math.max(36, insets.top + 24) }, getSlideStyle(3)]}>
          <Section
            title="Physical Examination (PE)"
          >
            {examItems.map((e, i) => (
              <BulletItem key={i}>{`${e.system}: ${e.findings}`}</BulletItem>
            ))}
          </Section>
        </Animated.View>
        
      </Animated.ScrollView>
      {(index < SLIDE_COUNT - 1) && (
        <View style={[styles.dotsContainer, { bottom: Math.max(70, insets.bottom + 20) }]} pointerEvents="none">
          {Array.from({ length: SLIDE_COUNT }, (_, d) => d).map((d) => (
            <View
              key={d}
              style={[
                styles.dot,
                { backgroundColor: d === index ? Colors.brand.darkPink : 'rgba(0,0,0,0.2)' },
              ]}
            />
          ))}
        </View>
      )}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          const newIndex = Math.max(0, index - 1);
          scrollRef.current?.scrollTo({ x: width * newIndex, animated: true });
        }}
        style={[styles.navButton, styles.navLeft, { bottom: Math.max(22, insets.bottom + 25) }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>
      {index < SLIDE_COUNT - 1 && index !== 3 && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            const newIndex = Math.min(SLIDE_COUNT - 1, index + 1);
            scrollRef.current?.scrollTo({ x: width * newIndex, animated: true });
          }}
          style={[styles.navButton, styles.navRight, { bottom: Math.max(22, insets.bottom + 25) }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={Colors.brand.darkPink} />
        </TouchableOpacity>
      )}
      {index === 3 && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('SelectTests', { caseData });
          }}
          style={[styles.primaryButton, styles.navRightCta, { bottom: Math.max(22, insets.bottom + 25) }]}
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
          <Text style={styles.primaryButtonText}>Send for Tests</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      )}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  carousel: { },
  slide: { paddingHorizontal: 10, paddingTop: 36, paddingBottom: 120, height: '100%', justifyContent: 'center', alignItems: 'stretch' },
  sectionBlock: { marginBottom: 20, alignItems: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    // Subtle bluish shadow to match app cards
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
  audioButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  ecgSvg: { marginTop: 6, marginBottom: 6 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6 },
  separatorLine: { flex: 1, height: 2, borderRadius: 2 },
  sectionBody: { fontSize: 14, lineHeight: 20, color: '#333' },
  sectionScroll: { flex: 1 },
  sectionScrollContent: { paddingBottom: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '800', opacity: 0.9 },
  fieldValue: { fontSize: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brand.darkPink, marginTop: 6, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  historyCategory: { fontSize: 14, fontWeight: '800', marginBottom: 4, marginTop: 8 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  statTile: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: '47%',
    maxWidth: '47%',
    height: 96,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { marginRight: 8 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { marginTop: 4, fontSize: 12, color: '#687076', fontWeight: '700' },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
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
  heroImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12, resizeMode: 'cover' },
  infoGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  infoCol: { alignItems: 'center', minWidth: 90 },
  infoLabel: { marginTop: 6, fontSize: 12, fontWeight: '800', opacity: 0.8 },
  infoValue: { marginTop: 2, fontSize: 16, fontWeight: '900', color: '#11181C' },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chiefContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255, 209, 224, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  subHeaderText: { fontSize: 14, fontWeight: '800', color: '#11181C' },
  chiefText: { marginTop: 6, fontSize: 16, fontWeight: '800' },
  tipCard: { borderWidth: 1, borderRadius: 14, marginTop: 16, padding: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipImage: { width: 44, height: 44, borderRadius: 8, resizeMode: 'contain' },
  tipTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tipSubtitle: { fontSize: 12, color: '#333' },
  tipCta: { marginTop: 8, fontSize: 14, fontWeight: '800', color: Colors.brand.blue },
  primaryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 60,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 120, opacity: 0.8 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 18 },
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
  },
  testCardSelected: {
    borderColor: Colors.brand.darkPink,
    backgroundColor: 'rgba(255, 0, 102, 0.08)'
  },
  testName: { marginTop: 0, marginLeft: 12, textAlign: 'left', fontWeight: '700', flex: 1 },
  testNameSelected: { color: Colors.brand.darkPink },
  selectedCheck: { position: 'absolute', top: 8, right: 8 },
  // Diagnosis card styles
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
  diagnosisCardSelected: {
    borderColor: Colors.brand.darkPink,
    backgroundColor: 'rgba(255, 0, 102, 0.08)'
  },
  diagnosisName: { marginTop: 0, marginLeft: 12, textAlign: 'left', fontWeight: '700', flex: 1 },
  diagnosisNameSelected: { color: Colors.brand.darkPink },
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
  navLeft: { left: 16 },
  navRight: { right: 16 },
  navRightCta: { position: 'absolute', right: 16, paddingHorizontal: 16 },
  // Bottom sheet styles
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#11181C' },
  auraOverlay: {
    position: 'absolute',
    right: 6,
    width: AURA_SIZE,
    height: AURA_SIZE,
    zIndex: 20
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff' },
  chipActive: { backgroundColor: 'rgba(255, 0, 102, 0.10)', borderColor: Colors.brand.darkPink },
  chipText: { fontSize: 12, fontWeight: '700', color: '#11181C' },
  chipTextActive: { color: Colors.brand.darkPink },
  reportCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, minHeight: 160, justifyContent: 'flex-start' },
  reportHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reportIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(30, 136, 229, 0.10)', borderWidth: 1, borderColor: 'rgba(30, 136, 229, 0.25)', alignItems: 'center', justifyContent: 'center' },
  simpleReportCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#fff', padding: 16, minHeight: 120, justifyContent: 'flex-start' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#11181C', flex: 1, flexWrap: 'wrap' , color: Colors.brand.darkPink},
  reportValueText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: '#333', fontWeight: '800' },
  sheetDotsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  sheetDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.12)' },
  sheetDotActive: { backgroundColor: Colors.brand.darkPink },
  sheetActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff' },
  secondaryButtonText: { fontWeight: '800', color: Colors.brand.darkPink },
  sheetPrimaryInRow: { paddingHorizontal: 16 },
});


