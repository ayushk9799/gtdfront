import React from 'react';
import { useWindowDimensions, View, Text, Image, ImageBackground, StyleSheet, Pressable, ScrollView, Platform, Animated, Easing, BackHandler } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Line } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import blackboard from '../../constants/seniorblackboard.png';
import { BlurView } from '@react-native-community/blur';
import { useSelector } from 'react-redux';
import { computeGameplayScoreNormalized } from '../services/scoring';
import PremiumBottomSheet from '../components/PremiumBottomSheet';

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

// Premium benefits (mirroring PremiumScreen)
const PREMIUM_BENEFITS = [
  'Specialist-level cases',
  'Unlimited Hearts',
  'Clinical images',
  'Deep Dive explanations',
  'No ads',
];

// Exact features matrix to mirror PremiumScreen
const PREMIUM_FEATURES = [
  { label: 'Intern to Attending cases', free: true, pro: true },
  { label: 'Specialist-level cases', free: false, pro: true },
  { label: 'Unlimited Hearts', free: false, pro: true },
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


  const caseData = caseDataFromRoute || caseDataFromStore || {};

  const layout = useWindowDimensions();
  // Alias mapping for initial tab labels coming from previous screens
  const normalizedInitialTab = (initialTabParam === 'Treatment Plan') ? 'Treatment' : initialTabParam;
  const [index, setIndex] = React.useState(
    Math.max(0, TABS.indexOf(TABS.includes(normalizedInitialTab) ? normalizedInitialTab : 'Tests'))
  );

  const [routes] = React.useState(
    TABS.map((t) => ({ key: t.toLowerCase(), title: t }))
  );

  const [insightsExpanded, setInsightsExpanded] = React.useState(true);
  const [howExpanded, setHowExpanded] = React.useState(true);
  const [rationaleExpanded, setRationaleExpanded] = React.useState(false);
  const [txExpanded, setTxExpanded] = React.useState(false);
  const [whyExpanded, setWhyExpanded] = React.useState(false);

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

  // Subtle fade/slide-in for active tab content
  const sceneAnimsRef = React.useRef({
    tests: { opacity: new Animated.Value(0), translateY: new Animated.Value(8) },
    diagnosis: { opacity: new Animated.Value(0), translateY: new Animated.Value(8) },
    treatment: { opacity: new Animated.Value(0), translateY: new Animated.Value(8) },
  });

  React.useEffect(() => {
    const activeKey = routes[index]?.key;
    if (!activeKey) return;
    const anims = sceneAnimsRef.current[activeKey];
    anims.opacity.setValue(0);
    anims.translateY.setValue(8);
    Animated.parallel([
      Animated.timing(anims.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(anims.translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [index, routes, sections]);

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
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={handleBackPress}
          style={styles.backBtnInline}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#ffffff" />
        </Pressable>
        <View style={styles.scoreBoardWrap}>
          <ImageBackground
            source={blackboard}
            resizeMode="cover"
            style={styles.scoreBoardBg}
            imageStyle={styles.scoreBoardBgImage}
          >
            <AnimatedNumber
              style={styles.scoreBoardText}
              value={scores.total}
              duration={800}
              formatter={(v) => `Score: ${Math.round(v)} / 100`}
            />
            {/* Bottom fade to blend image into page background */}
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(255,255,255,0)',
                'rgba(255,255,255,1)',
                '#FFFFFF',
                themeColors.card,
              ]}
              locations={[0, 0.3, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.scoreBoardBottomFade}
            />
            {headerDx.correct ? (
              <View style={styles.overlayDxWrap}>
                <View style={[styles.dxPill, styles.dxPillCorrect]}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={SUCCESS_COLOR} style={{ marginRight: 8 }} />
                  <Text style={[styles.dxPillText, styles.dxPillTextCorrect]}>{headerDx.correct}</Text>
                </View>
              </View>
            ) : null}
          </ImageBackground>
        </View>
        <View style={styles.topWrap}>
          {headerDx.mine && headerDx.mine !== headerDx.correct ? (
            <View style={[styles.dxPill, styles.dxPillMine]}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={ERROR_COLOR} style={{ marginRight: 8 }} />
              <Text style={[styles.dxPillText, styles.dxPillTextMine]}>{headerDx.mine}</Text>
            </View>
          ) : null}
        </View>
        {/* case review card */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderTopWidth: 0, marginTop: -14, minHeight: 600 }]}>
          <View style={styles.caseHeader}>
            <View style={styles.caseIconWrap}>
              <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#3B5B87" />
            </View>
            <Text style={styles.caseHeaderText}>CASE REVIEW</Text>
          </View>

          <TabView
            style={{ flex: 1, margin: 8 }}
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={(tabBarProps) => (
              <TabBar
                {...tabBarProps}
                activeColor={Colors.brand.darkPink}
                inactiveColor="#5C6C83"
                indicatorStyle={{ backgroundColor: Colors.brand.darkPink, height: 3, borderRadius: 2 }}
                style={{ backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E6EAF0' }}
                // tabStyle={{ width: layout.width / 3 }}
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
              return (
                <ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
                >
                  <Animated.View style={{ opacity: sceneAnimsRef.current[key].opacity, transform: [{ translateY: sceneAnimsRef.current[key].translateY }] }}>
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
                </ScrollView>
              );
            }}
          />
        </View>

        {/* core clinical insights card */}
        <View style={styles.insightCard}>
          <Pressable style={styles.insightHeaderRow} onPress={() => setInsightsExpanded((v) => !v)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.insightIconWrap}>
                <MaterialCommunityIcons name="chevron-right" size={16} color={SUCCESS_COLOR} />
              </View>
              <Text style={styles.insightHeaderText}>Core Clinical Insights</Text>
            </View>
            <MaterialCommunityIcons name={insightsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={SUCCESS_COLOR} />
          </Pressable>

          {insightsExpanded && (
            <>
              <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                {insights.map((insight, idx) => (
                  <InsightSection
                    key={idx}
                    title={insight.title}
                    bullets={insight.bullets}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* how we landed on the diagnosis */}
        {caseReview?.howWeLandedOnTheDiagnosis?.length ? (
          <View style={[styles.insightCard, styles.insightCardBlue]}>
            <Pressable style={styles.insightHeaderRow} onPress={() => setHowExpanded((v) => !v)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapBlue]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#2A4670" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextBlue]}>How We Landed on the Diagnosis</Text>
              </View>
              <MaterialCommunityIcons name={howExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#2A4670" />
            </Pressable>
            {howExpanded && (
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, !isPremium && { height: 550 }]}>
                {isPremium ? (
                  <HowDiagnosisList items={caseReview.howWeLandedOnTheDiagnosis} />
                ) : null}
                {!isPremium && (
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
            )}
          </View>
        ) : null}

        {/* rationale behind test selection */}
        {caseReview?.rationaleBehindTestSelection?.length ? (
          <View style={[styles.insightCard, styles.insightCardOrange]}>
            <Pressable style={styles.insightHeaderRow} onPress={() => setRationaleExpanded((v) => !v)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapOrange]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#6E4A13" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextOrange]}>Rationale Behind Test Selection</Text>
              </View>
              <MaterialCommunityIcons name={rationaleExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6E4A13" />
            </Pressable>
            {rationaleExpanded && (
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, !isPremium && { height: 550 }]}>
                {isPremium ? (
                  <TestRationaleList items={caseReview.rationaleBehindTestSelection} />
                ) : null}
                {!isPremium && (
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
            )}
          </View>
        ) : null}

        {/* treatment priority and sequencing */}
        {caseReview?.treatmentPriorityAndSequencing?.length ? (
          <View style={[styles.insightCard, styles.insightCardPurple]}>
            <Pressable style={styles.insightHeaderRow} onPress={() => setTxExpanded((v) => !v)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapPurple]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#5B2E91" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextPurple]}>Treatment Priority and Sequencing</Text>
              </View>
              <MaterialCommunityIcons name={txExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#5B2E91" />
            </Pressable>
            {txExpanded && (
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, !isPremium && { height: 550 }]}>
                {isPremium ? (
                  <TreatmentPriorityList items={caseReview.treatmentPriorityAndSequencing} />
                ) : null}
                {!isPremium && (
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
            )}
          </View>
        ) : null}

        {/* why other diagnoses didn't fit */}
        {caseReview?.whyOtherDiagnosesDidntFit?.length ? (
          <View style={[styles.insightCard, styles.insightCardRed]}>
            <Pressable style={styles.insightHeaderRow} onPress={() => setWhyExpanded((v) => !v)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.insightIconWrap, styles.insightIconWrapRed]}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#7B1F24" />
                </View>
                <Text style={[styles.insightHeaderText, styles.insightHeaderTextRed]}>Why Other Diagnoses Didn’t Fit</Text>
              </View>
              <MaterialCommunityIcons name={whyExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#7B1F24" />
            </Pressable>
            {whyExpanded && (
              <View style={[{ paddingHorizontal: 12, paddingBottom: 12, position: 'relative' }, !isPremium && { height: 550 }]}>
                {isPremium ? (
                  <WhyNotList items={caseReview.whyOtherDiagnosesDidntFit} />
                ) : null}
                {!isPremium && (
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
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* <Pressable style={styles.fab}>
        <MaterialCommunityIcons name="chevron-down" size={26} color="#FFFFFF" />
      </Pressable> */}
      <PremiumBottomSheet ref={premiumSheetRef} />
    </SafeAreaView>
  );
}

function BulletList({ bullets }) {
  if (!Array.isArray(bullets) || bullets.length === 0) return null;
  return (
    <View style={{ paddingTop: 16 }}>
      {bullets.map((b, i) => (
        <Text key={i} style={styles.insightBullet}>{`\u2022 ${b}`}</Text>
      ))}
    </View>
  );
}

function WhyNotList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <View style={{ paddingTop: 16 }}>
      {items.map((it, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <Text style={styles.insightTitle}>{it?.diagnosisName || 'Alternative Diagnosis'}</Text>
          {!!it?.reasoning && (
            <Text style={styles.insightBullet}>{`\u2022 ${it.reasoning}`}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function TreatmentPriorityList({ items }) {
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
              {!!title && <Text style={styles.treatmentStepTitle}>{title}</Text>}
              {!!desc && <Text style={styles.treatmentStepDesc}>{desc}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TestRationaleList({ items }) {
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
              <Text style={styles.rationaleTitle}>{name}</Text>
              {!!priority && (
                <View style={styles.rationaleChip}>
                  <Text style={styles.rationaleChipText}>{priority}</Text>
                </View>
              )}
            </View>
            {!!desc && <Text style={styles.rationaleDesc}>{desc}</Text>}
          </View>
        );
      })}
    </View>
  );
}

function HowDiagnosisList({ items }) {
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
              {!!title && <Text style={styles.howTitle}>{title}</Text>}
              {!!desc && <Text style={styles.howDesc}>{desc}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

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

function Section({ kind, title, items, showDivider }) {
  const color = kind === 'success' ? SUCCESS_COLOR : kind === 'error' ? ERROR_COLOR : INFO_COLOR;
  const bg = kind === 'success' ? SUCCESS_BG : kind === 'error' ? ERROR_BG : INFO_BG;
  const icon = kind === 'success' ? 'check-circle-outline' : kind === 'error' ? 'close-circle-outline' : 'information-outline';

  return (
    <View style={{ paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={[styles.sectionIconWrap, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>

      {items.map((text, i) => (
        <Text key={i} style={styles.bulletText}>{`\u2022 ${text}`}</Text>
      ))}

      {showDivider && <DashedDivider />}
    </View>
  );
}

function DashedDivider() {
  return (
    <Svg width="100%" height={1} style={{ marginTop: 10 }}>
      <Line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#E6EAF0" strokeWidth={StyleSheet.hairlineWidth} strokeDasharray="4 4" />
    </Svg>
  );
}

function InsightSection({ title, bullets }) {
  return (
    <View style={{ paddingTop: 16 }}>
      <Text style={styles.insightTitle}>{title}</Text>
      {bullets.map((b, i) => (
        <Text key={i} style={styles.insightBullet}>{`\u2022 ${b}`}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { paddingHorizontal: 8, paddingBottom: 120 },
  screenWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  topWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
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
  caseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, justifyContent: 'center' },
  caseIconWrap: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#E9EEF6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  caseHeaderText: { fontSize: 16, fontWeight: '800', color: '#5C6C83' },
  tabText: { fontSize: 20, fontWeight: '800', color: Colors.brand.darkPink },
  tabTextActive: { color: Colors.brand.darkPink },
  sectionIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  bulletText: { fontSize: 16, color: '#223148', marginVertical: 8, marginLeft: 6 },
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
  scoreBoardWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 0, alignSelf: 'stretch', width: '100%', },
  scoreBoardBg: { width: '100%', height: 400, paddingTop: 80 },
  scoreBoardBgImage: { borderRadius: 0 },
  scoreBoardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  scoreBoardBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  overlayDxWrap: { position: 'absolute', left: 20, right: 20, bottom: 10, alignItems: 'center' },
  overlayDxText: { color: '#0E6B51', textShadowColor: 'rgba(255,255,255,0.85)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  scoreBoardText: {
    fontSize: 28,
    color: '#FFFFFF',
    paddingLeft: 40,
    fontFamily: 'BrightChalk',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
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
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1B2D',
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
});