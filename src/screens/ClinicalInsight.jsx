import React from 'react';
import { useColorScheme, useWindowDimensions, View, Text, Image, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Line } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';

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

export default function ClinicalInsight() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const route = useRoute();
  const navigation = useNavigation();
  const initialTabParam = route?.params?.initialTab;
  const caseDataFromRoute = route?.params?.caseData;
  const {
    caseData: caseDataFromStore,
    selectedTestIds,
    selectedDiagnosisId,
    selectedTreatmentIds,
  } = useSelector((s) => s.currentGame);
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

  // Header diagnosis values
  const headerDx = React.useMemo(() => {
    const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
    const correct = diags.find((d) => d.isCorrect)?.diagnosisName || null;
    const mine = selectedDiagnosisId ? diags.find((d) => d.diagnosisId === selectedDiagnosisId)?.diagnosisName : null;
    return { correct, mine };
  }, [caseData, selectedDiagnosisId]);

  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtnInline} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#223148" />
        </Pressable>
        <View style={styles.topWrap}>
          {(headerDx.correct && headerDx.mine && headerDx.correct === headerDx.mine) ? (
            <>
              <Text style={styles.userDxGreenText}>{headerDx.mine}</Text>
              {headerDx.correct ? (
                <Text style={styles.headerLabelText}>
                  {`Correct diagnosis: `}
                  <Text style={styles.headerCorrectValueGreen}>{headerDx.correct}</Text>
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {headerDx.mine ? (
                <Text style={styles.userDxRedText}>{` ${headerDx.mine}`}</Text>
              ) : null}
              {headerDx.correct ? (
                <Text style={styles.headerLabelText}>
                  {`Correct : `}
                  <Text style={styles.headerCorrectValueGreen}>{headerDx.correct}</Text>
                </Text>
              ) : (
                <Text style={styles.headerLabelText}>
                  {`Correct : `}
                  <Text style={styles.headerCorrectValueGreen}>Unavailable</Text>
                </Text>
              )}
            </>
          )}
        </View>
        {/* case review card */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, minHeight: 600, }]}>
          <View style={styles.caseHeader}>
            <View style={styles.caseIconWrap}>
              <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#3B5B87" />
            </View>
            <Text style={styles.caseHeaderText}>CASE REVIEW</Text>
          </View>

          <TabView
            style={{ flex: 1, margin : 8 }}
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
              return (
                <View style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
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
                </View>
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
      </ScrollView>

      {/* <Pressable style={styles.fab}>
        <MaterialCommunityIcons name="chevron-down" size={26} color="#FFFFFF" />
      </Pressable> */}
    </SafeAreaView>
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
  container: { paddingHorizontal: 16, paddingBottom: 120 },
  screenWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  topWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
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
  caseHeaderText: { fontSize: 16, fontWeight: '800', color: '#5C6C83'},
  tabText: { fontSize: 20, fontWeight: '800', color : Colors.brand.darkPink },
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  insightCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10A694',
    backgroundColor: '#DDF4EF',
    padding: 12,
    marginTop: 16,
  },
  insightHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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