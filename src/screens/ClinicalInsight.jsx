import React from 'react';
import { useWindowDimensions, View, Text, Image, StyleSheet, Pressable, ScrollView, Platform, Animated, Easing, BackHandler, PanResponder, UIManager } from 'react-native';
import ReAnimated, { useSharedValue, useAnimatedStyle, withTiming, Easing as ReEasing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Line } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { BlurView } from '@react-native-community/blur';
import { useSelector } from 'react-redux';
import { computeGameplayScoreNormalized } from '../services/scoring';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import Sound from 'react-native-sound';
import Video from 'react-native-video';
import Pdf from 'react-native-pdf';
import Markdown from 'react-native-markdown-display';
import { getGamesPlayedCount, getFirstPlayedCaseId } from '../services/ratingService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animated Collapsible Component for smooth expand/collapse
const AnimatedCollapsible = ({ expanded, children }) => {
  const [contentHeight, setContentHeight] = React.useState(0);
  const [shouldRender, setShouldRender] = React.useState(expanded);
  const animatedHeight = useSharedValue(expanded ? 1 : 0);

  React.useEffect(() => {
    if (expanded) {
      setShouldRender(true);
    }
    animatedHeight.value = withTiming(expanded ? 1 : 0, {
      duration: 300,
      easing: ReEasing.bezier(0.4, 0, 0.2, 1),
    });
    // Delay unmounting until animation completes
    if (!expanded) {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [expanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: contentHeight > 0 ? animatedHeight.value * contentHeight : 2000 * animatedHeight.value,
    opacity: animatedHeight.value,
    overflow: 'hidden',
  }));

  if (!shouldRender && !expanded) return null;

  return (
    <ReAnimated.View style={animatedStyle}>
      <View
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          if (height > 0) {
            setContentHeight(height);
          }
        }}
      >
        {children}
      </View>
    </ReAnimated.View>
  );
};

const ORANGE = '#FF8A00';
// Match the app's subtle pink gradient
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];
const SUCCESS_COLOR = '#12A77A';
const SUCCESS_BG = '#EAF7F2';
const ERROR_COLOR = '#E2555A';
const ERROR_BG = '#FDEAEA';
const INFO_COLOR = '#6E4A13';
const INFO_BG = '#F6EFE4';

const TABS = ['Tests', 'Diagnosis', 'Treatment'];

const PREMIUM_FEATURES = [
  { label: 'Unlimited Cases', free: false, pro: true },
  { label: 'Daily Challenge', free: true, pro: true },
  { label: 'Video Overview', free: false, pro: true },
  { label: 'Clinical images', free: false, pro: true },
  { label: 'Deep Dive explanations', free: false, pro: true },
  { label: 'No ads', free: false, pro: true },
];

// Local animated number to avoid re-rendering the whole screen each frame
function AnimatedNumber({ value, duration = 800, easing = Easing.out(Easing.cubic), style, formatter }) {
  const animatedValueRef = React.useRef(new Animated.Value(0));
  const animatedValue = animatedValueRef.current;
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const id = animatedValue.addListener(({ value: v }) => setDisplay(v));
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);
  React.useEffect(() => {
    animatedValue.stopAnimation();
    Animated.timing(animatedValue, {
      toValue: value || 0,
      duration,
      easing,
      useNativeDriver: false,
    }).start();
  }, [value, duration, easing, animatedValue]);
  const text = typeof formatter === 'function' ? formatter(display) : String(Math.round(display));
  return <Text style={style}>{text}</Text>;
}

export default function ClinicalInsight() {
  const themeColors = Colors.light;
  const route = useRoute();
  const navigation = useNavigation();
  const initialTabParam = route?.params?.initialTab;
  const caseDataFromRoute = route?.params?.caseData;
  const premiumSheetRef = React.useRef(null);
  const scrollViewRef = React.useRef(null);

  // Refs for section Y positions (for cycling scroll)
  const sectionYRefs = React.useRef({
    coreInsights: 0,
    howLanded: 0,
    rationale: 0,
    treatmentPriority: 0,
    whyOther: 0,
  });
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(-1);
  const twinkleSoundRef = React.useRef(null);
  const pdfRef = React.useRef(null);

  // Determine if opened from SelectTreatment
  const openedFromTreatment = React.useMemo(() => {
    const fromParam =
      route?.params?.from ||
      route?.params?.source ||
      route?.params?.openedFrom ||
      route?.params?.origin ||
      null;
    const fromStr = typeof fromParam === 'string' ? fromParam.toLowerCase() : '';
    return fromStr.includes('treatment') || fromStr.includes('selecttreatment');
  }, [route]);

  // Play magical twinkle sound when opened from SelectTreatment
  React.useEffect(() => {
    if (!openedFromTreatment) return;

    // Setup sound category
    try { Sound.setCategory('Playback', true); } catch (_) { }
    try { Sound.enableInSilenceMode(true); } catch (_) { }

    // Play the twinkle sound with a small delay
    const delayTimeout = setTimeout(() => {
      const s = new Sound('magicaltwinkle.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (twinkleSoundRef.current !== s) {
          try { s.release(); } catch (_) { }
          return;
        }
        if (error) {
          try { s.release(); } catch (_) { }
          twinkleSoundRef.current = null;
          return;
        }
        s.play((finished) => {
          try { s.release(); } catch (_) { }
          if (twinkleSoundRef.current === s) {
            twinkleSoundRef.current = null;
          }
        });
      });
      twinkleSoundRef.current = s;
    }, 300);

    return () => {
      clearTimeout(delayTimeout);
      try {
        twinkleSoundRef.current?.stop?.();
        twinkleSoundRef.current?.release?.();
      } catch (_) { }
      twinkleSoundRef.current = null;
    };
  }, [openedFromTreatment]);
  const handleBackPress = React.useCallback(() => {
    const fromParam =
      route?.params?.from ||
      route?.params?.source ||
      route?.params?.openedFrom ||
      route?.params?.origin ||
      null;
    let prevRouteName = null;
    try {
      const state = navigation.getState && navigation.getState();
      const routes = state?.routes || [];
      const idx = typeof state?.index === 'number' ? state.index : routes.length - 1;
      if (idx > 0 && routes[idx - 1]?.name) prevRouteName = routes[idx - 1].name;
    } catch { }
    const fromStr = typeof fromParam === 'string' ? fromParam.toLowerCase() : '';
    const openedFromSelectTreatment =
      (fromStr.includes('treatment') || fromStr.includes('selecttreatment')) ||
      prevRouteName === 'SelectTreatment';
    const openedFromLearning =
      (fromStr.includes('learning')) ||
      prevRouteName === 'Learning';
    if (openedFromSelectTreatment) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
              state: {
                routes: [{ name: 'Home' }],
              },
            },
          ],
        })
      );
      return;
    }
    if (openedFromLearning) {
      navigation.goBack();
      return;
    }
    navigation.goBack();
  }, [navigation, route]);

  // Handle Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [handleBackPress])
  );

  const {
    caseData: caseDataFromStore,
    selectedTestIds,
    selectedDiagnosisId,
    selectedTreatmentIds,
  } = useSelector((s) => s.currentGame);

  const { isPremium } = useSelector(state => state.user);

  // Get games played count and first played case ID - re-read when screen comes into focus
  const [gamesPlayed, setGamesPlayed] = React.useState(0);
  const [firstPlayedCaseId, setFirstPlayedCaseIdState] = React.useState(null);
  useFocusEffect(
    React.useCallback(() => {
      setGamesPlayed(getGamesPlayedCount());
      setFirstPlayedCaseIdState(getFirstPlayedCaseId());
    }, [])
  );

  const caseData = caseDataFromRoute || caseDataFromStore || {};

  // Get current case ID for comparison - MUST be after caseData is defined
  const currentCaseId = caseData?.caseId || caseData?._id || null;

  // First played case should always be viewable without blur
  const isFirstPlayedCase = currentCaseId && firstPlayedCaseId && String(currentCaseId) === String(firstPlayedCaseId);
  const shouldShowPremiumBlur = !isPremium && !isFirstPlayedCase; // Show blur for non-premium users, except first case

  // Video preview state - allow 30 seconds preview for non-premium users
  const [videoPlayedSeconds, setVideoPlayedSeconds] = React.useState(0);
  const [videoPaused, setVideoPaused] = React.useState(true); // Start paused
  const [isVideoFullscreen, setIsVideoFullscreen] = React.useState(false);
  const videoRef = React.useRef(null);
  const shouldShowVideoPremiumOverlay = shouldShowPremiumBlur && videoPlayedSeconds >= 30;

  // Auto-pause video and exit fullscreen when 30 seconds reached
  React.useEffect(() => {
    if (shouldShowVideoPremiumOverlay) {
      setVideoPaused(true);
      // Exit fullscreen if in fullscreen mode so overlay is visible
      if (isVideoFullscreen) {
        videoRef.current?.dismissFullscreenPlayer();
      }
    }
  }, [shouldShowVideoPremiumOverlay, isVideoFullscreen]);

  // PDF preview state - allow slides 1-4 preview for non-premium users
  const [pdfAttemptedPastLimit, setPdfAttemptedPastLimit] = React.useState(false);

  // Show overlay when non-premium user is on page 4 and has attempted to go past it
  // OR if they somehow reach page 5+ (as additional safety)
  const shouldShowPdfPremiumOverlay = shouldShowPremiumBlur && (pdfAttemptedPastLimit || pdfCurrentPage >= 5);


  const layout = useWindowDimensions();
  // Alias mapping for initial tab labels coming from previous screens
  const normalizedInitialTab = (initialTabParam === 'Treatment Plan') ? 'Treatment' : initialTabParam;
  const [index, setIndex] = React.useState(
    Math.max(0, TABS.indexOf(TABS.includes(normalizedInitialTab) ? normalizedInitialTab : 'Diagnosis'))
  );

  const [routes] = React.useState(
    TABS.map((t) => ({ key: t.toLowerCase(), title: t }))
  );

  // Single expanded state for all tabs - when true, all tabs show full content
  const [isContentExpanded, setIsContentExpanded] = React.useState(false);
  const [contentHeights, setContentHeights] = React.useState({ tests: 200, diagnosis: 200, treatment: 200 });
  const COLLAPSED_HEIGHT = 285; // Content height when collapsed
  const COLLAPSED_TAB_HEIGHT = 350; // TabView height when collapsed
  // Calculate expanded height dynamically: max content height + tab bar (50) + padding (30) + button (50)
  const maxContentHeight = Math.max(contentHeights.tests, contentHeights.diagnosis, contentHeights.treatment);
  const EXPANDED_TAB_HEIGHT = maxContentHeight + 100;

  // Animated height for smooth transitions
  const animatedHeight = React.useRef(new Animated.Value(COLLAPSED_TAB_HEIGHT)).current;

  // Animate height when expanded state changes
  React.useEffect(() => {
    const targetHeight = isContentExpanded ? EXPANDED_TAB_HEIGHT : COLLAPSED_TAB_HEIGHT;
    Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // height cannot use native driver
    }).start();
  }, [isContentExpanded, EXPANDED_TAB_HEIGHT]);

  // Ping animation for check-circle icon
  const pingAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 2000, // Slower animation = less CPU
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pingLoop.start();
    return () => pingLoop.stop();
  }, []);

  const pingScale = pingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2], // Less scaling = better performance
  });
  const pingOpacity = pingAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 0.2, 0],
  });

  // Swipe gesture handler for PDF Premium Overlay - allow swiping back to slide 4
  const pdfOverlayPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect horizontal movement
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;
        if (gestureState.dx > swipeThreshold) {
          // Swiped right - go back to slide 4 and hide overlay
          setPdfAttemptedPastLimit(false);
          setPdfCurrentPage(4);
          pdfRef.current?.setPage(4);
        }
      },
    })
  ).current;

  const [insightsExpanded, setInsightsExpanded] = React.useState(true);
  const [howExpanded, setHowExpanded] = React.useState(true);
  const [rationaleExpanded, setRationaleExpanded] = React.useState(false);
  const [txExpanded, setTxExpanded] = React.useState(false);
  const [whyExpanded, setWhyExpanded] = React.useState(false);

  // Simple toggle function - AnimatedCollapsible handles animation
  const toggleSection = (setter) => setter((v) => !v);

  // PDF page tracking
  const [pdfCurrentPage, setPdfCurrentPage] = React.useState(1);
  const [pdfTotalPages, setPdfTotalPages] = React.useState(0);

  // Compute normalized scores (30/40/30)
  const scores = React.useMemo(() => {
    try {
      return computeGameplayScoreNormalized(caseData, {
        selectedTestIds,
        selectedDiagnosisId,
        selectedTreatmentIds,
      }) || { total: 0, tests: 0, diagnosis: 0, treatment: 0 };
    } catch (_) {
      return { total: 0, tests: 0, diagnosis: 0, treatment: 0 };
    }
  }, [caseData, selectedTestIds, selectedDiagnosisId, selectedTreatmentIds]);

  // Animated total score value
  // Animated via local AnimatedNumber to avoid screen-wide re-renders

  // Animated per-tab category scores (animate on tab change)
  // Animated locally per scene via AnimatedNumber

  // Subtle fade/slide-in for active tab content (disabled to prevent reload appearance)
  const sceneAnimsRef = React.useRef({
    tests: { opacity: new Animated.Value(1), translateX: new Animated.Value(0) },
    diagnosis: { opacity: new Animated.Value(1), translateX: new Animated.Value(0) },
    treatment: { opacity: new Animated.Value(1), translateX: new Animated.Value(0) },
  });

  // Track previous index for slide direction (kept for potential future use)
  const prevIndexRef = React.useRef(index);

  React.useEffect(() => {
    // Update prev index without animation - TabView handles its own swipe animation
    prevIndexRef.current = index;
  }, [index]);

  // Build evaluation sections from caseData + selections
  const sections = React.useMemo(() => {
    const sec = { tests: [], diagnosis: [], treatment: [] };

    // Tests (step 2 / index 1)
    const availableTests = caseData?.steps?.[1]?.data?.availableTests || [];
    const testById = new Map(availableTests.map((t) => [t.testId, t]));
    const selectedTests = (selectedTestIds || [])
      .map((id) => testById.get(id))
      .filter(Boolean);
    const correctSelectedTests = selectedTests.filter((t) => t.isRelevant);
    const unnecessarySelectedTests = selectedTests.filter((t) => !t.isRelevant);
    const missedRelevantTests = availableTests.filter((t) => t.isRelevant && !(selectedTestIds || []).includes(t.testId));

    if (correctSelectedTests.length) {
      sec.tests.push({ kind: 'success', title: 'Efficient Test Choices', items: correctSelectedTests.map((t) => t.testName) });
    }
    if (unnecessarySelectedTests.length) {
      sec.tests.push({ kind: 'error', title: 'Unnecessary Tests Ordered', items: unnecessarySelectedTests.map((t) => t.testName) });
    }
    if (missedRelevantTests.length) {
      sec.tests.push({ kind: 'info', title: 'Missed Key Tests', items: missedRelevantTests.map((t) => t.testName) });
    }

    // Diagnosis (step 3 / index 2)
    const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
    const diagById = new Map(diags.map((d) => [d.diagnosisId, d]));
    const correctDiagnosis = diags.find((d) => d.isCorrect);
    const userDiagnosis = selectedDiagnosisId ? diagById.get(selectedDiagnosisId) : null;
    if (userDiagnosis) {
      const userCorrect = !!userDiagnosis.isCorrect;
      sec.diagnosis.push({
        kind: userCorrect ? 'success' : 'error',
        title: 'Your Diagnosis',
        items: [userDiagnosis.diagnosisName],
      });
    }
    if (correctDiagnosis) {
      sec.diagnosis.push({ kind: 'info', title: 'Correct Diagnosis', items: [correctDiagnosis.diagnosisName] });
    }

    // Treatment (step 4 / index 3)
    const step4 = caseData?.steps?.[3]?.data || {};
    const treatmentOptions = step4?.treatmentOptions || {};
    const flatTreatments = [
      ...(treatmentOptions.medications || []),
      ...(treatmentOptions.surgicalInterventional || []),
      ...(treatmentOptions.nonSurgical || []),
      ...(treatmentOptions.psychiatric || []),
    ];
    const txById = new Map(flatTreatments.map((t) => [t.treatmentId, t]));
    const selectedTx = (selectedTreatmentIds || []).map((id) => txById.get(id)).filter(Boolean);
    const correctSelectedTx = selectedTx.filter((t) => t.isCorrect);
    const unnecessarySelectedTx = selectedTx.filter((t) => !t.isCorrect);
    const missedTx = flatTreatments.filter((t) => t.isCorrect && !(selectedTreatmentIds || []).includes(t.treatmentId));

    if (correctSelectedTx.length) {
      sec.treatment.push({ kind: 'success', title: 'Correct Treatments Given', items: correctSelectedTx.map((t) => t.treatmentName) });
    }
    if (unnecessarySelectedTx.length) {
      sec.treatment.push({ kind: 'error', title: 'Unnecessary Treatments Given', items: unnecessarySelectedTx.map((t) => t.treatmentName) });
    }
    if (missedTx.length) {
      sec.treatment.push({ kind: 'info', title: 'Missed Treatments', items: missedTx.map((t) => t.treatmentName) });
    }

    return sec;
  }, [caseData, selectedTestIds, selectedDiagnosisId, selectedTreatmentIds]);

  // Build core insights from case review if present
  const insights = React.useMemo(() => {
    const review = caseData?.steps?.[4]?.data; // stepNumber 5, index 4
    if (!review) return [];
    const out = [];
    if (review?.coreClinicalInsight?.correctDiagnosis) {
      out.push({ title: 'Correct Diagnosis', bullets: [review.coreClinicalInsight.correctDiagnosis] });
    }
    if (review?.coreClinicalInsight?.keyClues) {
      out.push({ title: 'Key Clues', bullets: [review.coreClinicalInsight.keyClues] });
    }
    if (review?.coreClinicalInsight?.essentialTests) {
      out.push({ title: 'Essential Tests', bullets: [review.coreClinicalInsight.essentialTests] });
    }
    if (Array.isArray(review?.coreClinicalInsight?.trapsToAvoid) && review.coreClinicalInsight.trapsToAvoid.length) {
      out.push({ title: 'Pitfalls to avoid', bullets: review.coreClinicalInsight.trapsToAvoid });
    }
    return out;
  }, [caseData]);

  // Full case review (step 5) data for additional reference cards
  const caseReview = React.useMemo(() => {
    return caseData?.steps?.[4]?.data || null;
  }, [caseData]);

  // Header diagnosis values
  const headerDx = React.useMemo(() => {
    const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
    const correct = diags.find((d) => d.isCorrect)?.diagnosisName || null;
    const mine = selectedDiagnosisId ? diags.find((d) => d.diagnosisId === selectedDiagnosisId)?.diagnosisName : null;
    return { correct, mine };
  }, [caseData, selectedDiagnosisId]);

  return (
    <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
      >
        <Pressable
          onPress={handleBackPress}
          style={styles.backBtnInline}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#ffffff" />
        </Pressable>
        <View style={styles.scoreSection}>
          <AnimatedNumber
            style={styles.scoreBoardText}
            value={scores.total}
            duration={800}
            formatter={(v) => `Score: ${Math.round(v)} / 100`}
          />
          {headerDx.correct ? (
            <View style={[styles.dxPill, styles.dxPillCorrect, { marginTop: 16, marginHorizontal: 16 }]}>
              <View style={{ position: 'relative', marginRight: 8 }}>
                {/* Ping effect - expanding circle */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: SUCCESS_COLOR,
                    transform: [{ scale: pingScale }],
                    opacity: pingOpacity,
                  }}
                />
                {/* Icon */}
                <MaterialCommunityIcons name="check-circle" size={18} color={SUCCESS_COLOR} />
              </View>
              <Markdown style={{ ...markdownStyles, body: { ...styles.dxPillText, ...styles.dxPillTextCorrect } }}>{headerDx.correct}</Markdown>
            </View>
          ) : null}
        </View>
        <View style={styles.topWrap}>
          {headerDx.mine && headerDx.mine !== headerDx.correct ? (
            <View style={[styles.dxPill, styles.dxPillMine]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={ERROR_COLOR} style={{ marginRight: 8 }} />
              <Markdown style={{ ...markdownStyles, body: { ...styles.dxPillText, ...styles.dxPillTextMine } }}>{headerDx.mine}</Markdown>
            </View>
          ) : null}
        </View>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderTopWidth: 0, marginTop: -14 }]}>
          <View style={styles.caseHeader}>
            <View style={styles.caseIconWrap}>
              <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#3B5B87" />
            </View>
            <Text style={styles.caseHeaderText}>CASE REVIEW</Text>
          </View>

          <Animated.View style={{ height: animatedHeight, margin: 4, overflow: 'hidden' }}>
            <TabView
              style={{ flex: 1 }}
              navigationState={{ index, routes }}
              onIndexChange={setIndex}
              initialLayout={{ width: layout.width }}
              swipeEnabled={true}
              renderTabBar={(tabBarProps) => (
                <TabBar
                  {...tabBarProps}
                  activeColor={Colors.brand.darkPink}
                  inactiveColor="#5C6C83"
                  indicatorStyle={{ backgroundColor: Colors.brand.darkPink, height: 3, borderRadius: 2 }}
                  style={{ backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E6EAF0' }}
                  renderLabel={({ route: r, focused }) => (
                    <Text style={[styles.tabText, focused ? styles.tabTextActive : null]}>{r.title}</Text>
                  )}
                />
              )}
              renderScene={({ route: r }) => {
                const key = r.key;
                const currentSections = sections[key] || [];
                const categoryMax = key === 'diagnosis' ? 40 : 30;
                const categoryScore = key === 'tests' ? scores.tests : key === 'diagnosis' ? scores.diagnosis : scores.treatment;

                // Show button only on Tests and Treatment tabs
                const showExpandButton = key === 'tests' || key === 'treatment';

                return (
                  <View style={{ flex: 1, paddingHorizontal: 8, paddingTop: 4 }}>
                    {/* Content wrapper with relative positioning for gradient overlay */}
                    <View style={{ position: 'relative', flex: 1, minHeight: !isContentExpanded ? COLLAPSED_HEIGHT : undefined }}>
                      {/* Content area with clipping when collapsed */}
                      <View style={!isContentExpanded ? { height: COLLAPSED_HEIGHT, overflow: 'hidden' } : { flex: 1 }}>
                        <Animated.View
                          style={{ opacity: sceneAnimsRef.current[key]?.opacity || 1, transform: [{ translateX: sceneAnimsRef.current[key]?.translateX || 0 }] }}
                          onLayout={(e) => {
                            const height = e.nativeEvent.layout.height;
                            setContentHeights(prev => {
                              if (prev[key] !== height && height > 0) {
                                return { ...prev, [key]: height };
                              }
                              return prev;
                            });
                          }}
                        >
                          <AnimatedNumber
                            style={[styles.bulletText, { marginLeft: 0, fontWeight: '900', color: Colors.brand.darkPink }]}
                            value={categoryScore}
                            duration={650}
                            formatter={(v) => `Score: ${Math.round(v)} / ${categoryMax}`}
                          />
                          {currentSections.length === 0 ? (
                            <Text style={[styles.bulletText, { marginLeft: 0 }]}>No items to display.</Text>
                          ) : (
                            currentSections.map((section, idx) => (
                              <Section
                                key={idx}
                                kind={section.kind}
                                title={section.title}
                                items={section.items}
                                showDivider={idx !== currentSections.length - 1}
                              />
                            ))
                          )}
                        </Animated.View>
                      </View>

                      {/* Gradient overlay with Show More button - for Tests and Treatment when collapsed */}
                      {(key === 'tests' || key === 'treatment') && !isContentExpanded && currentSections.length > 0 && (
                        <Pressable
                          onPress={() => setIsContentExpanded(true)}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: -8,
                            right: -8,
                            height: 70,
                          }}
                        >
                          <LinearGradient
                            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,1)']}
                            locations={[0, 0.5, 1]}
                            style={{
                              flex: 1,
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              paddingBottom: 10,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: Colors.brand.darkPink, fontWeight: '700', fontSize: 14 }}>
                                Show More
                              </Text>
                              <MaterialCommunityIcons
                                name="chevron-down"
                                size={18}
                                color={Colors.brand.darkPink}
                                style={{ marginLeft: 4 }}
                              />
                            </View>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>

                    {/* Show Less button when expanded - only on Tests and Treatment tabs */}
                    {showExpandButton && currentSections.length > 0 && isContentExpanded && (
                      <Pressable
                        onPress={() => setIsContentExpanded(false)}
                        style={{
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingBottom: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: Colors.brand.darkPink, fontWeight: '700', fontSize: 14 }}>
                            Show Less
                          </Text>
                          <MaterialCommunityIcons
                            name="chevron-up"
                            size={18}
                            color={Colors.brand.darkPink}
                            style={{ marginLeft: 4 }}
                          />
                        </View>
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
          </Animated.View>
        </View>

        {/* Video Overview - Standalone Card (only show if available) */}
        {caseData?.videooverview ? (
          <View style={[styles.insightCard, styles.insightCardPurple]}>
            <View style={styles.insightHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapPurple]}>
                  <MaterialCommunityIcons name="video-outline" size={16} color="#5B2E91" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextPurple]}>Video Overview</Text>
              </View>
            </View>
            <View style={[styles.inlineVideoContainer, { position: 'relative' }]}>
              {/* Always show video - track progress for premium overlay */}
              <Video
                ref={videoRef}
                source={{ uri: caseData.videooverview }}
                style={styles.inlineVideo}
                resizeMode="contain"
                controls={!shouldShowVideoPremiumOverlay}
                paused={videoPaused}
                onPlaybackStateChanged={(state) => {
                  if (state.isPlaying && !shouldShowVideoPremiumOverlay) {
                    setVideoPaused(false);
                  }
                }}
                controlsTimeout={1000}
                hideShutterView={true}
                onProgress={(data) => {
                  if (shouldShowPremiumBlur && !shouldShowVideoPremiumOverlay) {
                    setVideoPlayedSeconds(Math.floor(data.currentTime));
                  }
                }}
                onFullscreenPlayerWillPresent={() => setIsVideoFullscreen(true)}
                onFullscreenPlayerWillDismiss={() => setIsVideoFullscreen(false)}
                controlsStyles={{
                  hideNavigationBarOnFullScreenMode: true,
                  hideNotificationBarOnFullScreenMode: true,
                  liveLabel: '',
                }}
              />

              {/* Show premium overlay after 30 seconds for non-premium users */}
              {shouldShowVideoPremiumOverlay && (
                <>
                  <BlurView
                    style={styles.premiumBlur}
                    blurType={'light'}
                    blurAmount={10}
                    overlayColor={Platform.OS === 'android' ? 'rgba(242,236,250,0.85)' : 'transparent'} // Purple theme
                  />
                  <View style={styles.premiumOverlay}>
                    <MaterialCommunityIcons name="video-outline" size={40} color="#5B2E91" />
                    <Text style={[styles.premiumOverlayText, { fontSize: 16, marginTop: 4 }]}>Unlock Full Video with Premium</Text>
                    {/* <Text style={{ color: '#5B2E91', fontSize: 13, marginTop: 4, textAlign: 'center', fontWeight: '600' }}>
                      Watch full video to unlock premium
                    </Text> */}
                    <Pressable style={[styles.premiumCtaButton, { marginTop: 8 }]} onPress={() => premiumSheetRef.current?.present()}>
                      <Text style={styles.premiumCtaButtonText}>Buy Premium</Text>
                    </Pressable>
                    <Pressable
                      style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        // Seek video to 0 seconds and restart 30-second preview
                        videoRef.current?.seek(0);
                        setVideoPlayedSeconds(0);
                        setVideoPaused(false);
                      }}
                    >
                      <MaterialCommunityIcons name="restart" size={16} color="#5B2E91" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#5B2E91', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' }}>Restart Video</Text>
                    </Pressable>

                  </View>
                </>
              )}
            </View>
          </View>
        ) : null}

        {/* Slide Deck PDF - Standalone Card (only show if available) */}
        {caseData?.slidedeck ? (
          <View style={[styles.insightCard, styles.insightCardOrange]}>
            <View style={styles.insightHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapOrange]}>
                  <MaterialCommunityIcons name="file-presentation-box" size={16} color="#6E4A13" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextOrange]}>Slide Deck (PDF)</Text>
              </View>
            </View>
            <View style={[styles.inlinePdfContainer, { position: 'relative' }]}>
              {/* Render PDF with page limit for non-premium users */}
              <Pdf
                ref={pdfRef}
                source={{ uri: caseData.slidedeck, cache: true }}
                style={styles.inlinePdf}
                horizontal={true}
                enablePaging={true}
                trustAllCerts={false}
                onLoadComplete={(numberOfPages) => {
                  setPdfTotalPages(numberOfPages);
                  setPdfCurrentPage(1);
                }}
                onPageChanged={(page) => {
                  // For non-premium users, don't allow going past page 4
                  if (shouldShowPremiumBlur && page > 4) {
                    pdfRef.current?.setPage(4);
                    setPdfAttemptedPastLimit(true); // Trigger overlay
                  } else {
                    setPdfCurrentPage(page);
                  }
                }}
              />

              {/* Show premium overlay when non-premium user tries to go beyond slide 4 */}
              {shouldShowPdfPremiumOverlay && (
                <>
                  <BlurView
                    style={styles.premiumBlur}
                    blurType={'light'}
                    blurAmount={10}
                    overlayColor={Platform.OS === 'android' ? 'rgba(246,239,228,0.85)' : 'transparent'} // Orange theme
                  />
                  <View style={styles.premiumOverlay} {...pdfOverlayPanResponder.panHandlers}>
                    <MaterialCommunityIcons name="file-presentation-box" size={40} color="#6E4A13" />
                    <Text style={[styles.premiumOverlayText, { fontSize: 16, marginTop: 8 }]}>Unlock with Premium</Text>
                    <Text style={{ color: '#6E4A13', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                      {pdfTotalPages > 4 ? `${pdfTotalPages - 4} more slides available` : 'More content available'}
                    </Text>
                    <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                      <Text style={styles.premiumCtaButtonText}>Buy Premium</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
            {/* Page indicator dots - show limited dots for non-premium users */}
            {pdfTotalPages > 0 && (
              <View style={styles.pdfDotsContainer}>
                {Array.from({ length: shouldShowPremiumBlur ? Math.min(pdfTotalPages, 4) : pdfTotalPages }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pdfDot,
                      !shouldShowPdfPremiumOverlay && pdfCurrentPage === i + 1 && { backgroundColor: '#FF8A00', width: 10, height: 10, borderRadius: 5 },
                    ]}
                  />
                ))}
                {/* Show locked indicator for non-premium users if more pages exist */}
                {shouldShowPremiumBlur && pdfTotalPages > 4 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <MaterialCommunityIcons
                      name="lock"
                      size={14}
                      color={shouldShowPdfPremiumOverlay ? '#FF8A00' : '#A0AEC0'}
                    />
                    <Text style={{
                      fontSize: 12,
                      color: shouldShowPdfPremiumOverlay ? '#FF8A00' : '#A0AEC0',
                      marginLeft: 2,
                      fontWeight: shouldShowPdfPremiumOverlay ? '900' : '500'
                    }}>+{pdfTotalPages - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* core clinical insights card */}
        <View
          style={styles.insightCard}
          onLayout={(e) => {
            sectionYRefs.current.coreInsights = e.nativeEvent.layout.y;
          }}
        >
          <Pressable style={styles.insightHeaderRow} onPress={() => toggleSection(setInsightsExpanded)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.insightIconWrap}>
                <MaterialCommunityIcons name="chevron-right" size={16} color={SUCCESS_COLOR} />
              </View>
              <Text style={styles.insightHeaderText}>Core Clinical Insights</Text>
            </View>
            <MaterialCommunityIcons name={insightsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={SUCCESS_COLOR} />
          </Pressable>

          <AnimatedCollapsible expanded={insightsExpanded}>
            <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
              {insights.map((insight, idx) => (
                <InsightSection
                  key={idx}
                  title={insight.title}
                  bullets={insight.bullets}
                />
              ))}
            </View>
          </AnimatedCollapsible>
        </View>

        {/* how we landed on the diagnosis */}
        {caseReview?.howWeLandedOnTheDiagnosis?.length ? (
          <View
            style={[styles.insightCard, styles.insightCardBlue]}
            onLayout={(e) => {
              sectionYRefs.current.howLanded = e.nativeEvent.layout.y;
            }}
          >
            <Pressable style={styles.insightHeaderRow} onPress={() => toggleSection(setHowExpanded)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapBlue]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#2A4670" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextBlue]}>How We Landed on the Diagnosis</Text>
              </View>
              <MaterialCommunityIcons name={howExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#2A4670" />
            </Pressable>
            <AnimatedCollapsible expanded={howExpanded}>
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, shouldShowPremiumBlur && { height: 550 }]}>
                {!shouldShowPremiumBlur ? (
                  <HowDiagnosisList items={caseReview.howWeLandedOnTheDiagnosis} />
                ) : null}
                {shouldShowPremiumBlur && (
                  <>
                    <BlurView
                      style={styles.premiumBlur}
                      blurType={'light'}
                      blurAmount={10}
                      overlayColor={Platform.OS === 'android' ? 'rgba(255,255,255,0.82)' : 'transparent'}
                    />
                    <View style={styles.premiumOverlay}>
                      <Text style={styles.premiumOverlayText}>Clinical detailed analysis only available for premium user</Text>
                      <PremiumBenefitsTable />
                      <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                        <Text style={styles.premiumCtaButtonText}>Buy Premium & Unlock</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </AnimatedCollapsible>
          </View>
        ) : null}

        {/* rationale behind test selection */}
        {caseReview?.rationaleBehindTestSelection?.length ? (
          <View
            style={[styles.insightCard, styles.insightCardOrange]}
            onLayout={(e) => {
              sectionYRefs.current.rationale = e.nativeEvent.layout.y;
            }}
          >
            <Pressable style={styles.insightHeaderRow} onPress={() => toggleSection(setRationaleExpanded)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapOrange]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#6E4A13" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextOrange]}>Rationale Behind Test Selection</Text>
              </View>
              <MaterialCommunityIcons name={rationaleExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6E4A13" />
            </Pressable>
            <AnimatedCollapsible expanded={rationaleExpanded}>
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, shouldShowPremiumBlur && { height: 550 }]}>
                {!shouldShowPremiumBlur ? (
                  <TestRationaleList items={caseReview.rationaleBehindTestSelection} />
                ) : null}
                {shouldShowPremiumBlur && (
                  <>
                    <BlurView
                      style={styles.premiumBlur}
                      blurType={'light'}
                      blurAmount={10}
                      overlayColor={Platform.OS === 'android' ? 'rgba(255,255,255,0.82)' : 'transparent'}
                    />
                    <View style={styles.premiumOverlay}>
                      <Text style={styles.premiumOverlayText}>Clinical detailed analysis only available for premium user</Text>
                      <PremiumBenefitsTable />
                      <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                        <Text style={styles.premiumCtaButtonText}>Buy Premium & Unlock</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </AnimatedCollapsible>
          </View>
        ) : null}

        {/* treatment priority and sequencing */}
        {caseReview?.treatmentPriorityAndSequencing?.length ? (
          <View
            style={[styles.insightCard, styles.insightCardPurple]}
            onLayout={(e) => {
              sectionYRefs.current.treatmentPriority = e.nativeEvent.layout.y;
            }}
          >
            <Pressable style={styles.insightHeaderRow} onPress={() => toggleSection(setTxExpanded)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapPurple]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#5B2E91" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextPurple]}>Treatment Priority and Sequencing</Text>
              </View>
              <MaterialCommunityIcons name={txExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#5B2E91" />
            </Pressable>
            <AnimatedCollapsible expanded={txExpanded}>
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, shouldShowPremiumBlur && { height: 550 }]}>
                {!shouldShowPremiumBlur ? (
                  <TreatmentPriorityList items={caseReview.treatmentPriorityAndSequencing} />
                ) : null}
                {shouldShowPremiumBlur && (
                  <>
                    <BlurView
                      style={styles.premiumBlur}
                      blurType={'light'}
                      blurAmount={10}
                      overlayColor={Platform.OS === 'android' ? 'rgba(255,255,255,0.82)' : 'transparent'}
                    />
                    <View style={styles.premiumOverlay}>
                      <Text style={styles.premiumOverlayText}>Clinical detailed analysis only available for premium user</Text>
                      <PremiumBenefitsTable />
                      <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                        <Text style={styles.premiumCtaButtonText}>Buy Premium & Unlock</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </AnimatedCollapsible>
          </View>
        ) : null}

        {/* why other diagnoses didn't fit */}
        {caseReview?.whyOtherDiagnosesDidntFit?.length ? (
          <View
            style={[styles.insightCard, styles.insightCardRed]}
            onLayout={(e) => {
              sectionYRefs.current.whyOther = e.nativeEvent.layout.y;
            }}
          >
            <Pressable style={styles.insightHeaderRow} onPress={() => toggleSection(setWhyExpanded)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapRed]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#7B1F24" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextRed]}>Why Other Diagnoses Didn't Fit</Text>
              </View>
              <MaterialCommunityIcons name={whyExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#7B1F24" />
            </Pressable>
            <AnimatedCollapsible expanded={whyExpanded}>
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, shouldShowPremiumBlur && { height: 550 }]}>
                {!shouldShowPremiumBlur ? (
                  <WhyNotList items={caseReview.whyOtherDiagnosesDidntFit} />
                ) : null}
                {shouldShowPremiumBlur && (
                  <>
                    <BlurView
                      style={styles.premiumBlur}
                      blurType={'light'}
                      blurAmount={10}
                      overlayColor={Platform.OS === 'android' ? 'rgba(255,255,255,0.82)' : 'transparent'}
                    />
                    <View style={styles.premiumOverlay}>
                      <Text style={styles.premiumOverlayText}>Clinical detailed analysis only available for premium user</Text>
                      <PremiumBenefitsTable />
                      <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                        <Text style={styles.premiumCtaButtonText}>Buy Premium & Unlock</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </AnimatedCollapsible>
          </View>
        ) : null}

        {/* Clinical Infographic - Standalone Card (only show if available) */}
        {caseData?.infographic ? (
          <View style={styles.standaloneResourceCard}>
            <View style={styles.resourceInfoRow}>
              <MaterialCommunityIcons name="image-multiple-outline" size={20} color="#14919B" />
              <Text style={styles.resourceTitle}>Clinical Infographic</Text>
            </View>
            <View style={[styles.inlineImageContainer, { position: 'relative' }]}>
              {!shouldShowPremiumBlur ? (
                <Image
                  source={{ uri: caseData.infographic }}
                  style={styles.inlineImage}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <BlurView
                    style={styles.premiumBlur}
                    blurType={'light'}
                    blurAmount={10}
                    overlayColor={Platform.OS === 'android' ? 'rgba(255,255,255,0.82)' : 'transparent'}
                  />
                  <View style={styles.premiumOverlay}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={40} color="#14919B" />
                    <Text style={[styles.premiumOverlayText, { fontSize: 16, marginTop: 8 }]}>Unlock with Premium</Text>
                    <Pressable style={styles.premiumCtaButton} onPress={() => premiumSheetRef.current?.present()}>
                      <Text style={styles.premiumCtaButtonText}>Buy Premium</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Floating scroll-to-insights button */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          // Build array of available sections in order
          const sectionKeys = ['coreInsights', 'howLanded', 'rationale', 'treatmentPriority', 'whyOther'];
          const availableSections = sectionKeys.filter((key) => {
            const y = sectionYRefs.current[key];
            return y > 0; // Only include sections that exist (have a non-zero Y position)
          });

          if (availableSections.length === 0) return;

          // Cycle to next section
          const nextIndex = (currentSectionIndex + 1) % availableSections.length;
          const nextSectionKey = availableSections[nextIndex];
          const nextY = sectionYRefs.current[nextSectionKey];

          scrollViewRef.current?.scrollTo({ y: nextY, animated: true });
          setCurrentSectionIndex(nextIndex);
        }}
      >
        <MaterialCommunityIcons name="chevron-down" size={48} color="#FFFFFF" />
      </Pressable>
      <PremiumBottomSheet ref={premiumSheetRef} />
    </SafeAreaView >
  );
}

const markdownStyles = {
  body: {
    fontSize: 16,
    color: '#223148',
  },
  strong: {
    fontWeight: 'bold',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap',
  },
};

const WhyNotList = React.memo(({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <View style={{ paddingTop: 16 }}>
      {items.map((it, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <Markdown style={{ ...markdownStyles, body: styles.insightTitle }}>{it?.diagnosisName || 'Alternative Diagnosis'}</Markdown>
          {!!it?.reasoning && (
            <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'flex-start' }}>
              <Text style={[styles.insightBullet, { marginTop: Platform.OS === 'ios' ? 0 : 2 }]}>{`\u2022 `}</Text>
              <View style={{ flex: 1 }}>
                <Markdown style={markdownStyles}>{it.reasoning}</Markdown>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
});

const TreatmentPriorityList = React.memo(({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const parseItem = (text, index) => {
    if (typeof text !== 'string') {
      return { step: index + 1, title: '', desc: String(text) };
    }
    let raw = text.trim();
    // Strip starting bold markers if present
    if (raw.startsWith('**')) raw = raw.slice(2);
    const boldSplit = raw.split('**');
    const head = boldSplit[0] || raw;
    const remainder = boldSplit.slice(1).join('**').trim();
    // Extract "N. Title[:]" from head
    const m = head.match(/^\s*(\d+)\.\s*(.*?)(:)?\s*$/);
    const step = m ? parseInt(m[1], 10) : (index + 1);
    const title = m ? (m[2] || '').trim() : head.replace(/^(\d+)\.\s*/, '').trim().replace(/:$/, '');
    const desc = remainder && remainder.length > 0 ? remainder : (raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : '');
    return { step, title, desc };
  };
  return (
    <View style={{ paddingTop: 16 }}>
      {items.map((it, idx) => {
        const { step, title, desc } = parseItem(it, idx);
        return (
          <View key={idx} style={styles.treatmentStepRow}>
            <View style={styles.treatmentStepBadge}>
              <Text style={styles.treatmentStepBadgeText}>{step}</Text>
            </View>
            <View style={styles.treatmentStepContent}>
              {!!title && (
                <Markdown style={{ ...markdownStyles, body: styles.treatmentStepTitle }}>{title}</Markdown>
              )}
              {!!desc && (
                <Markdown style={{ ...markdownStyles, body: styles.treatmentStepDesc }}>{desc}</Markdown>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const TestRationaleList = React.memo(({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const parseRationale = (text) => {
    if (typeof text !== 'string') return { name: String(text), priority: '', desc: '' };
    let raw = text.trim();
    // Remove starting/ending bold markers if present
    if (raw.startsWith('**')) raw = raw.slice(2);
    if (raw.endsWith('**')) raw = raw.slice(0, -2);
    // Split head (before **) and remainder (after **)
    const parts = text.startsWith('**') ? text.split('**') : [raw];
    // head is typically the bold section
    const head = parts.length > 1 ? parts[1] : parts[0];
    const after = parts.length > 2 ? parts.slice(2).join('**').trim() : '';
    // From head, extract "Name (Priority):"
    const headClean = head.replace(/\*\*/g, '').trim();
    const colonIdx = headClean.lastIndexOf(':');
    const headNoColon = colonIdx >= 0 ? headClean.slice(0, colonIdx).trim() : headClean;
    // Extract "(Priority)" if present
    let name = headNoColon;
    let priority = '';
    const prMatch = headNoColon.match(/\(([^)]+)\)\s*$/);
    if (prMatch) {
      priority = prMatch[1].trim();
      name = headNoColon.replace(/\(([^)]+)\)\s*$/, '').trim();
    }
    // Description: prefer "after", else split raw after the first colon
    let desc = after && after.length ? after : '';
    if (!desc) {
      const firstColon = raw.indexOf(':');
      if (firstColon >= 0) {
        desc = raw.slice(firstColon + 1).trim();
      }
    }
    return { name, priority, desc };
  };
  return (
    <View style={{ paddingTop: 16 }}>
      {items.map((it, i) => {
        const { name, priority, desc } = parseRationale(it);
        return (
          <View key={i} style={styles.rationaleRow}>
            <View style={styles.rationaleHeader}>
              <Markdown style={{ ...markdownStyles, body: styles.rationaleTitle }}>{name}</Markdown>
              {!!priority && (
                <View style={styles.rationaleChip}>
                  <Text style={styles.rationaleChipText}>{priority}</Text>
                </View>
              )}
            </View>
            {!!desc && (
              <Markdown style={{ ...markdownStyles, body: styles.rationaleDesc }}>{desc}</Markdown>
            )}
          </View>
        );
      })}
    </View>
  );
});

const HowDiagnosisList = React.memo(({ items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const parseHow = (text) => {
    if (typeof text !== 'string') return { title: String(text), desc: '' };
    let raw = text.trim();
    // Remove leading/trailing bold markers
    if (raw.startsWith('**')) raw = raw.slice(2);
    if (raw.endsWith('**')) raw = raw.slice(0, -2);
    // If the original had bold, split to get head and remainder
    const parts = text.startsWith('**') ? text.split('**') : [raw];
    const head = parts.length > 1 ? parts[1] : parts[0];
    const after = parts.length > 2 ? parts.slice(2).join('**').trim() : '';
    const headClean = head.replace(/\*\*/g, '').trim();
    // Split at first colon to get title and description
    const colonIdx = headClean.indexOf(':');
    const title = colonIdx >= 0 ? headClean.slice(0, colonIdx).trim() : headClean;
    let desc = after && after.length ? after : '';
    if (!desc) {
      const firstColon = raw.indexOf(':');
      if (firstColon >= 0) {
        desc = raw.slice(firstColon + 1).trim();
      }
    }
    return { title, desc };
  };
  return (
    <View style={{ paddingTop: 16 }}>
      {items.map((it, i) => {
        const { title, desc } = parseHow(it);
        return (
          <View key={i} style={styles.howRow}>
            <View style={styles.howBullet}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#2A4670" />
            </View>
            <View style={styles.howContent}>
              {!!title && (
                <Markdown style={{ ...markdownStyles, body: styles.howTitle }}>{title}</Markdown>
              )}
              {!!desc && (
                <Markdown style={{ ...markdownStyles, body: styles.howDesc }}>{desc}</Markdown>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

function PremiumBenefitsTable() {
  return (
    <View style={styles.premiumTableCard}>
      <View style={styles.premiumTableHeader}>
        <View style={{ flex: 1 }} />
        <View style={styles.premiumTableHeaderCell}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#6C6C6C' }}>FREE</Text>
        </View>
        <View style={styles.premiumTableHeaderCell}>
          <View style={styles.premiumProPill}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>PRO</Text>
          </View>
        </View>
      </View>
      {PREMIUM_FEATURES.map((f, idx) => (
        <View
          key={f.label}
          style={[
            styles.premiumTableRow,
            { borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#F2F2F2' },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.premiumTableLabel}>{f.label}</Text>
          </View>
          <View style={styles.premiumTableCell}>
            {f.free ? (
              <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
            ) : (
              <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
            )}
          </View>
          <View style={styles.premiumTableCell}>
            {f.pro ? (
              <MaterialCommunityIcons name="check" size={20} color="#00C4B3" />
            ) : (
              <MaterialCommunityIcons name="minus" size={20} color="#B0B7BF" />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const Section = React.memo(({ kind, title, items, showDivider }) => {
  const color = kind === 'success' ? SUCCESS_COLOR : kind === 'error' ? ERROR_COLOR : INFO_COLOR;
  const bg = kind === 'success' ? SUCCESS_BG : kind === 'error' ? ERROR_BG : INFO_BG;
  const icon = kind === 'success' ? 'check-circle-outline' : kind === 'error' ? 'close-circle-outline' : 'information-outline';

  return (
    <View style={{ paddingTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>

      {items.map((text, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' }}>
          <Text style={[styles.bulletText, { marginTop: Platform.OS === 'ios' ? 0 : 2 }]}>{`\u2022 `}</Text>
          <View style={{ flex: 1 }}>
            <Markdown style={{ ...markdownStyles, body: styles.bulletText }}>{text}</Markdown>
          </View>
        </View>
      ))}

      {showDivider && <DashedDivider />}
    </View>
  );
});

function DashedDivider() {
  return (
    <Svg width="100%" height={1} style={{ marginTop: 10 }}>
      <Line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#E6EAF0" strokeWidth={StyleSheet.hairlineWidth} strokeDasharray="4 4" />
    </Svg>
  );
}

const InsightSection = React.memo(({ title, bullets }) => {
  return (
    <View style={{ paddingTop: 16 }}>
      <Markdown style={{ ...markdownStyles, body: styles.insightTitle }}>{title}</Markdown>
      {bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' }}>
          <Text style={[styles.insightBullet, { marginTop: Platform.OS === 'ios' ? 0 : 2 }]}>{`\u2022 `}</Text>
          <View style={{ flex: 1 }}>
            <Markdown style={{ ...markdownStyles, body: styles.insightBullet }}>{b}</Markdown>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { paddingHorizontal: 8, paddingBottom: 120 },
  screenWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  topWrap: { alignItems: 'center', paddingTop: 0, paddingBottom: 8, marginBottom: 16, marginHorizontal: 16 },
  scoreSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 4, width: '100%' },
  topImage: {
    width: 96,
    height: 96,
    borderRadius: 20,
    marginBottom: 8,
    resizeMode: 'cover',
    backgroundColor: '#F3F6FA',
  },
  caseTitle: { fontSize: 24, fontWeight: '900', color: '#FF407D', textAlign: 'center' },
  caseSubtitle: { fontSize: 18, fontWeight: '500', color: '#223148', textAlign: 'center', marginTop: 8, marginBottom: 8 },
  correctDxText: { fontSize: 22, fontWeight: '900', color: '#12A77A', textAlign: 'center' },
  userDxText: { fontSize: 16, fontWeight: '800', color: '#1E88E5', textAlign: 'center', marginTop: 6 },
  userDxGreenText: { fontSize: 22, fontWeight: '900', color: '#12A77A', textAlign: 'center' },
  userDxRedText: { fontSize: 18, fontWeight: '900', color: '#E2555A', textAlign: 'center' },
  headerLabelText: { fontSize: 14, fontWeight: '800', color: '#5C6C83', textAlign: 'center', marginTop: 6 },
  headerCorrectValueGreen: { fontSize: 16, fontWeight: '900', color: '#12A77A' },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1E88E5',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  // removed flex growth on the card to keep it compact
  caseHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingBottom: 4, justifyContent: 'center' },
  caseIconWrap: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#E9EEF6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  caseHeaderText: { fontSize: 16, fontWeight: '800', color: '#5C6C83' },
  tabText: { fontSize: 20, fontWeight: '800', color: Colors.brand.darkPink },
  tabTextActive: { color: Colors.brand.darkPink },
  sectionIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  bulletText: { fontSize: 16, color: '#223148', marginVertical: 2, marginLeft: 4 },
  // removed fixed-position back button
  backBtnInline: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginLeft: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.darkPink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  scoreBoardWrap: { width: '100%' },
  scoreBoardBg: { width: '100%', aspectRatio: 1, maxHeight: 450 },
  scoreBoardBgImage: { borderRadius: 0, resizeMode: 'cover', borderColor: '#FFEB3B', borderWidth: 2 },
  scoreBoardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  scoreBoardBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  overlayDxWrap: { position: 'absolute', left: 20, right: 20, bottom: 50, alignItems: 'center' },
  overlayDxText: { color: '#0E6B51', textShadowColor: 'rgba(255,255,255,0.85)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  scoreBoardText: {
    fontSize: 50,
    color: '#C24467',
    textAlign: 'center',
    fontFamily: 'BrightChalk',
  },
  dxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  dxPillCorrect: {
    backgroundColor: 'rgba(234, 247, 242, 0.95)',
    borderWidth: 1,
    borderColor: '#C8EDE1',
  },
  dxPillMine: {
    backgroundColor: 'rgba(233, 201, 201, 0.95)',
    borderWidth: 1,
    borderColor: '#F5C7C9',
  },
  dxPillText: {
    fontSize: 16,
    fontWeight: '900',
  },
  dxPillTextCorrect: { color: SUCCESS_COLOR },
  dxPillTextMine: { color: ERROR_COLOR },
  insightCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10A694',
    backgroundColor: '#DDF4EF',
    padding: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  insightHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 3, elevation: 3 },
  insightIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C8EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  insightHeaderText: { color: '#1F9E90', fontWeight: '800', fontSize: 18 },

  insightTitle: { fontSize: 18, fontWeight: '900', color: '#163D3A', marginBottom: 6 },
  insightBullet: { fontSize: 15.5, color: '#163D3A', lineHeight: 22, marginLeft: 6 },
  // Themed variants for additional cards
  insightCardBlue: {
    borderColor: '#B7C7E6',
    backgroundColor: '#EAF1FB',
  },
  insightHeaderTextBlue: { color: '#2A4670' },
  insightIconWrapBlue: { backgroundColor: '#D6E4FB' },
  insightCardOrange: {
    borderColor: '#E6D5B8',
    backgroundColor: '#F6EFE4',
  },
  insightHeaderTextOrange: { color: '#6E4A13' },
  insightIconWrapOrange: { backgroundColor: '#F2E3CA' },
  insightCardPurple: {
    borderColor: '#D8C8F2',
    backgroundColor: '#F2ECFA',
  },
  insightHeaderTextPurple: { color: '#5B2E91' },
  insightIconWrapPurple: { backgroundColor: '#E6DDF7' },
  insightCardRed: {
    borderColor: '#F0C9CD',
    backgroundColor: '#FBECEE',
  },
  insightHeaderTextRed: { color: '#7B1F24' },
  insightIconWrapRed: { backgroundColor: '#F6D9DB' },
  treatmentStepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  treatmentStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C8EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  treatmentStepBadgeText: { color: SUCCESS_COLOR, fontWeight: '900' },
  treatmentStepContent: { flex: 1 },
  treatmentStepTitle: { fontSize: 16.5, fontWeight: '900', color: '#163D3A' },
  treatmentStepDesc: { fontSize: 15.5, color: '#163D3A', lineHeight: 22, marginTop: 2 },
  rationaleRow: { marginBottom: 14 },
  rationaleHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  rationaleTitle: { fontSize: 16.5, fontWeight: '900', color: '#6E4A13', marginRight: 8 },
  rationaleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F2E3CA',
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  rationaleChipText: { fontSize: 12.5, fontWeight: '800', color: '#6E4A13' },
  rationaleDesc: { fontSize: 15.5, color: '#6E4A13', lineHeight: 22, marginTop: 4 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  howBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D6E4FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  howContent: { flex: 1 },
  howTitle: { fontSize: 16.5, fontWeight: '900', color: '#2A4670' },
  howDesc: { fontSize: 15.5, color: '#2A4670', lineHeight: 22, marginTop: 2 },
  premiumBlur: { ...StyleSheet.absoluteFillObject, borderRadius: 12, zIndex: 1 },
  premiumCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCtaText: {
    backgroundColor: '#2A4670',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '900',
    overflow: 'hidden',
  },
  premiumOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  premiumOverlayText: {
    color: '#0D0D0D',
    // color : Colors.brand.darkPink,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 20,
  },
  premiumBenefits: {
    width: '100%',
    marginBottom: 12,
  },
  premiumBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  premiumBenefitText: {
    marginLeft: 6,
    color: '#2A4670',
    fontWeight: '800',
    fontSize: 13.5,
  },
  premiumCtaButton: {
    backgroundColor: Colors.brand.darkPink,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  premiumCtaButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  premiumTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDEDED',
    overflow: 'hidden',
    width: '100%',
    marginBottom: 12,
  },
  premiumTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  premiumTableHeaderCell: { width: 56, alignItems: 'center', justifyContent: 'center' },
  premiumProPill: {
    backgroundColor: Colors.brand.darkPink,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  premiumTableLabel: { color: '#24323D', fontSize: 14, fontWeight: '700' },
  premiumTableCell: { width: 56, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 60,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1B2D',
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  // Teal-themed card for Case Resources
  insightCardTeal: {
    borderColor: '#B2DFDB',
    backgroundColor: '#E0F2F1',
  },
  insightHeaderTextTeal: { color: '#0D7377' },
  insightIconWrapTeal: { backgroundColor: '#B2DFDB' },
  // Standalone resource card (no parent wrapper)
  standaloneResourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    padding: 12,
    marginTop: 16,
    shadowColor: '#14919B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  // Resource card styles
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    padding: 8,
    marginBottom: 12,
    shadowColor: '#14919B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  resourceImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E0F7FA',
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resourcePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F7FA',
  },
  resourcePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  resourceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D7377',
    marginLeft: 8,
  },
  resourceDesc: {
    fontSize: 14,
    color: '#5C6C83',
    lineHeight: 20,
  },
  // Disabled states
  resourceCardDisabled: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  resourceTitleDisabled: {
    color: '#9E9E9E',
  },
  resourceDescDisabled: {
    color: '#BDBDBD',
  },
  comingSoonBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E65100',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#1A1A1A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Infographic modal
  infographicModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infographicCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
  },
  infographicFullImage: {
    width: '100%',
    height: '80%',
  },
  // Inline content styles
  inlineVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  inlineVideo: {
    width: '100%',
    height: '100%',
  },
  inlineImageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginTop: 8,
  },
  inlineImage: {
    width: '100%',
    height: '100%',
  },
  inlinePdfContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ba1d1dff',
    marginTop: 8,
  },
  inlinePdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  resourcePlaceholderSmall: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  // PDF page indicator dots
  pdfDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 4,
  },
  pdfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 4,
  },
  pdfDotActive: {
    backgroundColor: '#14919B',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});