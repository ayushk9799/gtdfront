import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable,TouchableOpacity,  Image, Animated, InteractionManager } from 'react-native';
import PagerView from 'react-native-pager-view';
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
import ComingSoonImage from './components/ComingSoonImage';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

// Match the app's subtle pink gradient
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

// Card height as a percentage of the screen height
const CARD_HEIGHT_PCT = 0.70;
const CARD_HEIGHT_PX = Math.round(Dimensions.get('window').height * CARD_HEIGHT_PCT);
const AURA_SIZE = 70;


// DecorativeSeparator is now a shared component

function Section({ title, children, onPressAudio, audioPlaying, audioDisabled, audioLoading, footer }) {
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
            <Pressable
              accessibilityRole="button"
              onPress={onPressAudio}
              style={({ pressed }) => [
                styles.audioButton,
                { opacity: pressed ? 0.8 : 1.0 },
              ]}
              disabled={audioDisabled || audioLoading}
            >
              <MaterialCommunityIcons
                name={audioLoading ? 'progress-clock' : (audioPlaying ? 'pause' : 'play')}
                size={18}
                color={audioDisabled ? 'rgba(0,0,0,0.25)' : Colors.brand.darkPink}
              />
            </Pressable>
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
        {footer ? (
          <View style={styles.sectionFooterOverlay}>
            {footer}
          </View>
        ) : null}
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
  // Use refs instead of state for audio status to avoid re-renders
  const isPlayingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentPartRef = useRef(null);
  const auraRef = useRef(null);
  const [showAura, setShowAura] = useState(false);
  
  const pagerRef = useRef(null);
  const SLIDE_COUNT = 4; // Basic, Vitals, Hx, PE
  
  // Track if user manually paused audio - prevents auto-play on slide change
  const userPausedAudioRef = useRef(false);

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
  const { isPremium } = useSelector((s) => s.user || {});
  const caseData = caseDataFromRoute || caseDataFromStore || {};
  const caseId = (caseData?.caseId && String(caseData.caseId)) || '';
  const [heroLoadError, setHeroLoadError] = useState(false);
  const mainImageUrl = caseData?.mainimage || '';
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [selectedPhysImageIndex, setSelectedPhysImageIndex] = useState(0);
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const imageSheetRef = useRef(null);
  const imageSnapPoints = useMemo(() => ['45%'], []);
  const renderImageBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.25}
      />
    ),
    []
  );
  const physPagerRef = useRef(null);
  const physScrollRef = useRef(null);
  const [physContainerWidth, setPhysContainerWidth] = useState(0);
  


  useEffect(() => {
    setHeroLoadError(false);
    setHeroLoaded(false);
  }, [mainImageUrl]);
  
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, index - 1);
    setIndex(newIndex);
    pagerRef.current?.setPage(newIndex);
  }, [index]);

  const handleNext = useCallback(() => {
    
    const newIndex = Math.min(SLIDE_COUNT - 1, index + 1);
    setIndex(newIndex);
    pagerRef.current?.setPage(newIndex);
  }, [index]);

  const handleSendForTests = useCallback(() => {
    navigation.navigate('SelectTests', { caseData });
  }, [navigation, caseData]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;


  const currentIndexRef = useRef(index);
  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);
  const handleAuraPress = useCallback(() => {
    // stable handler: implementation lives in togglePlayForIndexRef
    togglePlayForIndexRef.current?.(currentIndexRef.current);
  }, []);

  // Audio playback timer ref for cleanup
  const audioTimerRef = useRef(null);
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


  // Extract data from the CASES_ARRAY structure (steps[0].data)
  const step1Data = caseData?.steps?.[0]?.data || {};
  
  const p = step1Data?.basicInfo || {};
  const chief = step1Data?.chiefComplaint || '';
  const historyItems = step1Data?.history || [];
  const examItems = step1Data?.physicalExamination || [];
  const physicalImages = caseData?.physicalimage|| [];

  const vitalsData = step1Data?.vitals || {};
  const totalPhysImages = Array.isArray(physicalImages) ? physicalImages.length : 0;
  const goPrevPhysImage = useCallback(() => {
    if (totalPhysImages < 1) return;
    const i = Math.max(0, selectedPhysImageIndex - 1);
    setSelectedPhysImageIndex(i);
    try { physPagerRef.current?.setPage?.(i); } catch (_) {}
    try {
      if (physContainerWidth > 0) {
        physScrollRef.current?.scrollTo?.({ x: i * physContainerWidth, animated: true });
      }
    } catch (_) {}
  }, [selectedPhysImageIndex, totalPhysImages, physContainerWidth]);
  const goNextPhysImage = useCallback(() => {
    if (totalPhysImages < 1) return;
    const i = Math.min(totalPhysImages - 1, selectedPhysImageIndex + 1);
    setSelectedPhysImageIndex(i);
    try { physPagerRef.current?.setPage?.(i); } catch (_) {}
    try {
      if (physContainerWidth > 0) {
        physScrollRef.current?.scrollTo?.({ x: i * physContainerWidth, animated: true });
      }
    } catch (_) {}
  }, [selectedPhysImageIndex, totalPhysImages, physContainerWidth]);
  useEffect(() => {
    try {
      if (physContainerWidth > 0) {
        physScrollRef.current?.scrollTo?.({ x: selectedPhysImageIndex * physContainerWidth, animated: false });
      }
    } catch (_) {}
  }, [physContainerWidth]);
  
  // Convert vitals object to array format for display
  const displayVitals = useMemo(() => {
    const vitalsArray = [
      { name: 'Temperature', value: vitalsData.temperature },
      { name: 'Heart Rate', value: vitalsData.heartRate },
      { name: 'Blood Pressure', value: vitalsData.bloodPressure },
      { name: 'Respiratory Rate', value: vitalsData.respiratoryRate },
      { name: 'O2 Saturation', value: vitalsData.oxygenSaturation },
      { name: 'Weight', value: vitalsData.weight }
    ].filter(v => v.value);
  
    // Normalize vitals ordering to a friendly display
    const vitalsOrder = ['Temperature', 'Heart Rate', 'Blood Pressure', 'Respiratory Rate', 'O2 Saturation', 'Weight'];
    return vitalsOrder
      .map((label) => vitalsArray.find((v) => v.name === label))
      .filter(Boolean);
  }, [vitalsData]);


  const indexToPart = {
    0: 'basicspeech',
    1: 'vitalsspeech',
    2: 'historyspeech',
    3: 'physicalspeech',
  };
  const urlFor = (id, part) => `https://gtdthousandways1.s3.ap-south-1.amazonaws.com/mp3files/${id}_${part}.mp3`;

  const stopPlayback = useCallback(() => {
    try {
      soundRef.current?.stop?.();
      soundRef.current?.release?.();
    } catch (_) {}
    soundRef.current = null;
    isPlayingRef.current = false;
    isLoadingRef.current = false;
    currentPartRef.current = null;
    try { auraRef.current?.stop?.(); } catch (_) {}
  }, []);

  const playForIndex = useCallback((i) => {
    if (!caseId) return;
    const part = indexToPart[i];
    const url = urlFor(caseId, part);
    // stop prior if any
    stopPlayback();
    isLoadingRef.current = true;
    try { Sound.setCategory('Playback', true); } catch (_) {}
    try { Sound.enableInSilenceMode(true); } catch (_) {}
    const s = new Sound(url, undefined, (error) => {
      // Race condition guard: check if this sound is still the current one
      // If user swiped away while loading, soundRef.current will be different/null
      if (soundRef.current !== s) {
        try { s.release(); } catch (_) {}
        return;
      }
      if (error) {
        console.warn('Audio load error:', error);
        isLoadingRef.current = false;
        isPlayingRef.current = false;
        currentPartRef.current = null;
        try { auraRef.current?.stop?.(); } catch (_) {}
        return;
      }
      isLoadingRef.current = false;
      isPlayingRef.current = true;
      currentPartRef.current = part;
      try { auraRef.current?.start?.(); } catch (_) {}
      s.play(() => {
        try { s.release(); } catch (_) {}
        // Only update refs if this sound is still the active one
        if (soundRef.current === s) {
          soundRef.current = null;
          isPlayingRef.current = false;
          currentPartRef.current = null;
          try { auraRef.current?.stop?.(); } catch (_) {}
        }
      });
    });
    soundRef.current = s;
  }, [caseId, stopPlayback]);

  const togglePlayForIndex = useCallback((i) => {
    const part = indexToPart[i];
    if (isPlayingRef.current && currentPartRef.current === part) {
      // User manually paused - prevent auto-play on slide changes
      userPausedAudioRef.current = true;
      stopPlayback();
    } else {
      // User manually started - allow auto-play again
      userPausedAudioRef.current = false;
      playForIndex(i);
    }
  }, [playForIndex, stopPlayback]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        stopPlayback();
      };
    }, [stopPlayback])
  );

  React.useEffect(() => {
    // Clear any pending audio timer
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    
    // Stop any active playback immediately when index changes
    stopPlayback();

    // Don't auto-play if user manually paused, or no caseId
    if (!caseId || userPausedAudioRef.current) {
      return undefined;
    }

    // Single 200ms delay - simple and predictable
    audioTimerRef.current = setTimeout(() => {
      if (!userPausedAudioRef.current) {
        playForIndex(index);
      }
    }, 200);

    return () => {
      if (audioTimerRef.current) {
        clearTimeout(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      stopPlayback();
    };
  }, [index, caseId, playForIndex, stopPlayback]);
  // Defer mounting the heavy aura until interactions settle
  useEffect(() => {
    let task = InteractionManager.runAfterInteractions(() => {
      setShowAura(true);
    });
    return () => {
      task?.cancel?.();
    };
  }, []);
  // Stable ref for toggle function used by AudioAura
  const togglePlayForIndexRef = useRef(togglePlayForIndex);
  useEffect(() => {
    togglePlayForIndexRef.current = togglePlayForIndex;
  }, [togglePlayForIndex]);
  const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
  
  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => {
          setIndex(e.nativeEvent.position);
        }}
      >
        <View key="1" style={[styles.slide, { paddingTop: Math.max(36, insets.top + 24) }]}>
          <Section
            title="Basic Info & Chief Complaint"
          >
            {!heroLoadError && mainImageUrl ? (
              <Image
                source={{ uri: mainImageUrl }}
                onLoad={() => {
                  setHeroLoaded(true);
                  try { 
                    
                   } catch (_) {}
                }}
                onError={(e) => {
                  setHeroLoadError(true);
                  try { console.warn('Main image failed:', mainImageUrl, e?.nativeEvent); } catch (_) {}
                }}
                style={styles.heroImage}
              />
            ) : (
              <ComingSoonImage style={styles.heroImage} />
            )}
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
        </View>
        <View key="2" style={[styles.slide, { paddingTop: Math.max(36, insets.top + 24) }]}>
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
                    v.name?.includes('O2') ? 'diving-scuba-tank' :
                    v.name === 'Weight' ? 'weight-kilogram' : 'dots-horizontal'
                  }
                  label={v.name}
                  value={v.value}
                />
              ))}
            </View>
          </Section>
        </View>
        <View key="3" style={[styles.slide, { paddingTop: Math.max(36, insets.top + 24) }]}>
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
        </View>
        <View key="4" style={[styles.slide, { paddingTop: Math.max(36, insets.top + 24) }]}>
          <Section
            title="Physical Examination (PE)"
            footer={
              physicalImages.length > 0 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    try { setSelectedPhysImageIndex(0); } catch (_) {}
                    imageSheetRef.current?.expand?.();
                  }}
                  style={styles.sectionFloatingButton}
                  activeOpacity={0.95}
                >
                  <LinearGradient
                    colors={["#F472B6", "#FB7185"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sectionFloatingButtonGradient}
                  />
                  <MaterialCommunityIcons name="image-multiple-outline" size={16} color="#fff" />
                  <Text style={styles.sectionFloatingButtonText}>View Images</Text>
                </TouchableOpacity>
              ) : null
            }
          >
            {
  examItems.map((e, i) => (
    <BulletItem key={i}>{`${e.system}: ${e.findings}`}</BulletItem>
  ))}
          </Section>
        </View>
      </PagerView>

      <BottomSheet
        ref={imageSheetRef}
        index={-1}
        snapPoints={imageSnapPoints}
        enablePanDownToClose
        backdropComponent={renderImageBackdrop}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -2 } }}
        handleIndicatorStyle={{ backgroundColor: Colors.brand.darkPink }}
        onChange={(idx) => {
          try { setIsImageSheetOpen(typeof idx === 'number' && idx >= 0); } catch (_) {}
        }}
      >
        <BottomSheetView style={{ paddingTop: 30, paddingHorizontal: 16, paddingBottom: 16 }}>
          <LinearGradient
            colors={['#FFF7FA', '#F3F6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetHeaderTitle}>Physical Exam Images</Text>
            {totalPhysImages > 0 ? (
              <Text style={styles.sheetHeaderMeta}>{`${selectedPhysImageIndex + 1}/${totalPhysImages}`}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => imageSheetRef.current?.close?.()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ marginLeft: 'auto', opacity: pressed ? 0.8 : 1.0 }]}
            >
              <MaterialCommunityIcons name="close" size={25} color={Colors.brand.darkPink} />
            </Pressable>
          </View>
          {totalPhysImages > 0 ? (
            <>
              <View style={styles.physImageContainer} onLayout={(e) => { try { setPhysContainerWidth(e.nativeEvent.layout.width); } catch (_) {} }}>
                <ScrollView
                  ref={physScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const w = Math.max(1, physContainerWidth);
                    const x = e?.nativeEvent?.contentOffset?.x || 0;
                    const i = Math.round(x / w);
                    setSelectedPhysImageIndex(Math.min(Math.max(0, i), totalPhysImages - 1));
                  }}
                >
                  {physicalImages.map((item, idx) => (
                    <View key={String(idx)} style={{ width: physContainerWidth, height: '100%' }}>
                      {item?.url ? (
                        <Image
                          source={{ uri: item.url }}
                          style={styles.physImage}
                          resizeMode="contain"
                          blurRadius={!isPremium ? 30 : 0}
                        />
                      ) : (
                        <ComingSoonImage style={{ width: '100%', height: '100%' }} />
                      )}
                    </View>
                  ))}
                </ScrollView>
                {/* Nav chevrons */}
                <TouchableOpacity
                  onPress={goPrevPhysImage}
                  disabled={selectedPhysImageIndex <= 0}
                  style={[styles.navOverlayButton, { left: 10, opacity: selectedPhysImageIndex <= 0 ? 0.5 : 1 }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="chevron-left" size={22} color="#11181C" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goNextPhysImage}
                  disabled={selectedPhysImageIndex >= totalPhysImages - 1}
                  style={[styles.navOverlayButton, { right: 10, opacity: selectedPhysImageIndex >= totalPhysImages - 1 ? 0.5 : 1 }]}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="chevron-right" size={22} color="#11181C" />
                </TouchableOpacity>
              </View>
              {/* Dots + caption */}
              <View style={styles.indicatorDotsRow}>
                {physicalImages.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.indicatorDot, i === selectedPhysImageIndex && styles.indicatorDotActive]}
                  />
                ))}
              </View>
              <Text style={styles.sheetCaptionText}>
                {(physicalImages[selectedPhysImageIndex]?.tag) || 'Image'}
              </Text>
            </>
          ) : (
            <ComingSoonImage style={{ width: '100%', aspectRatio: 16/9 }} />
          )}
        </BottomSheetView>
      </BottomSheet>

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
        {showAura && (
          <AudioAura
            ref={auraRef}
            size={AURA_SIZE}
            onPress={handleAuraPress}
            disabled={!caseId}
          />
        )}
      </View>
      <View style={[styles.headerOverlay, { top: 12 + insets.top }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          onPress={handleClose}
          hitSlop={hitSlop}
          style={({ pressed }) => [
            styles.closeButton,
            { opacity: pressed ? 0.8 : 1.0 },
          ]}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* DOTS INDICATOR (visual only) */}
      {(index < SLIDE_COUNT - 1) && (
        <View
          style={[styles.dotsContainer, { bottom: Math.max(80, insets.bottom + 70) }]}
          pointerEvents="none"
        >
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

      {/* BOTTOM CONTROLS CONTAINER */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: Math.max(24, insets.bottom + 24) },
        ]}
        pointerEvents="box-none"
      >
       
        {index > 0 && !isImageSheetOpen ? (
          <Pressable
            accessibilityRole="button"
            onPress={handlePrevious}
            hitSlop={hitSlop}
            style={({ pressed }) => [
              styles.navButton,
              { opacity: pressed ? 0.8 : 1.0 },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={Colors.brand.darkPink}
            />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}

        {!isImageSheetOpen && index === 3 ? (
          // <Pressable
          //   accessibilityRole="button"
          //   onPress={handleSendForTests}
          //   hitSlop={hitSlop}
          //   style={({ pressed }) => [
          //     styles.primaryButton,
          //     { opacity: pressed ? 0.9 : 1.0 },
          //   ]}
          // >
          //   <LinearGradient
          //     colors={["#F472B6", "#FB7185"]}
          //     start={{ x: 0, y: 0 }}
          //     end={{ x: 1, y: 0 }}
          //     style={styles.primaryButtonGradient}
          //   />
          //   <Text style={styles.primaryButtonText}>Send for Tests</Text>
          //   <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          // </Pressable>
          <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('SelectTests', { caseData });
          }}
          style={[styles.primaryButton, styles.navRightCta]}
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
        ) : !isImageSheetOpen ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            hitSlop={hitSlop}
            style={({ pressed }) => [
              styles.navButton,
              { opacity: pressed ? 0.8 : 1.0 },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color={Colors.brand.darkPink}
            />
          </Pressable>
        ) : <View style={{ width: 48 }} />}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  pagerView: { flex: 1 },
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
  sectionFooterOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    alignItems: 'flex-end',
  },
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
    // alignItems : 'center'
  },
  statHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { marginRight: 8 },
  statValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
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
    zIndex: 100,
    elevation: 100,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.darkPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    elevation: 100,
  },
  heroImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12, resizeMode: 'cover' },
  infoGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  infoCol: { alignItems: 'center', minWidth: 90 },
  infoLabel: { marginTop: 6, fontSize: 12, fontWeight: '800', opacity: 0.8 },
  infoValue: { marginTop: 2, fontSize: 16, fontWeight: '500', color: '#11181C' },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chiefContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255, 209, 224, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  subHeaderText: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  chiefText: { marginTop: 6, fontSize: 16, fontWeight: '400', fontFamily : 'Roboto-Medium' },
  tipCard: { borderWidth: 1, borderRadius: 14, marginTop: 16, padding: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipImage: { width: 44, height: 44, borderRadius: 8, resizeMode: 'contain' },
  tipTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tipSubtitle: { fontSize: 12, color: '#333' },
  tipCta: { marginTop: 8, fontSize: 14, fontWeight: '800', color: Colors.brand.blue },
  primaryButton: {
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

  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16},
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
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  navButton: {
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
  // Bottom sheet styles
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#11181C', marginRight : 10 },
  sheetHeaderMeta: { fontSize: 12, fontWeight: '800', color: '#687076' },
  sheetTabsContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  auraOverlay: {
    position: 'absolute',
    right: 6,
    width: AURA_SIZE,
    height: AURA_SIZE,
    zIndex: 120,
    elevation: 120,
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
  // Tabs for Physical Exam images
  sectionFloatingButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionFloatingButtonGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  sectionFloatingButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  tabPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(255, 0, 102, 0.08)',
    borderColor: Colors.brand.darkPink,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#11181C',
  },
  tabPillTextActive: {
    color: Colors.brand.darkPink,
  },
  physImageContainer: {
    marginTop: 6,
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  physImage: {
    width: '100%',
    height: '100%',
  },
  navOverlayButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDotsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  indicatorDotActive: {
    backgroundColor: Colors.brand.darkPink,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetCaptionText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    color: '#687076',
    fontWeight: '700',
  },
});

