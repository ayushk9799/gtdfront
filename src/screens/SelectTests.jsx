import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Image } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

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
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.sectionBlock}>
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
          <ECGUnderline />
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

export default function SelectTests() {
  const { width } = Dimensions.get('window');
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const caseData = (route?.params && route.params.caseData) ? route.params.caseData : {};
  const availableTests = caseData?.diagnosticWorkup?.availableTests || [];
  const testResults = caseData?.diagnosticWorkup?.testResults || {};

  const [selectedTests, setSelectedTests] = useState([]);
  const [evaluatedResults, setEvaluatedResults] = useState([]);

  const testsById = useMemo(() => {
    const map = new Map();
    for (const t of availableTests) map.set(t.id, t);
    return map;
  }, [availableTests]);

  const iconForTest = (t) => {
    if (!t) return 'beaker-outline';
    switch (t.id) {
      case 'card_ekg':
        return 'heart-pulse';
      case 'rad_cxr':
        return 'x-ray';
      case 'rad_cta':
        return 'radiology-box';
      case 'rad_us':
        return 'image';
      case 'hem_ddimer':
        return 'beaker-outline';
      case 'path_trop':
        return 'blood-bag';
      case 'path_bmp':
        return 'beaker';
      default:
        break;
    }
    if (t.category === 'Cardiology') return 'heart-pulse';
    if (t.category === 'Radiology') return 'image';
    if (t.category === 'Clinical Pathology') return 'beaker';
    if (t.category === 'Hematology') return 'beaker-outline';
    return 'beaker-outline';
  };

  const toggleTest = (id) => {
    setSelectedTests((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const handleEvaluate = () => {
    const results = selectedTests.map((id) => {
      const meta = testsById.get(id);
      return { id, name: meta?.name || id, value: testResults?.[id] };
    });
    setEvaluatedResults(results);
  };

  const reportsSheetRef = useRef(null);
  const reportsScrollRef = useRef(null);
  const [reportIndex, setReportIndex] = useState(0);
  const reportSnapPoints = React.useMemo(() => ['45%', '80%'], []);
  const renderBackdrop = React.useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    ),
    []
  );

  const presentReportsSheet = () => {
    if (!selectedTests || selectedTests.length === 0) return;
    handleEvaluate();
    setReportIndex(0);
    reportsSheetRef.current?.present();
  };

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
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: Math.max(36, insets.top + 24), paddingBottom: 120 }}>
        <Section title="Select Tests">
          <View style={styles.testGrid}>
            {availableTests.map((t) => {
              const selected = selectedTests.includes(t.id);
              const icon = iconForTest(t);
              return (
                <TouchableOpacity
                  key={t.id}
                  accessibilityRole="button"
                  onPress={() => toggleTest(t.id)}
                  style={[styles.testCard, selected && styles.testCardSelected]}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons name={icon} size={28} color={selected ? Colors.brand.darkPink : '#687076'} />
                  <Text style={[styles.testName, selected && styles.testNameSelected]}>{t.name}</Text>
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
        style={[styles.navButton, styles.navLeft, { bottom: Math.max(22, insets.bottom + 25) }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={presentReportsSheet}
        disabled={!selectedTests || selectedTests.length === 0}
        style={[styles.primaryButton, styles.navRightCta, { bottom: Math.max(22, insets.bottom + 25) }, (!selectedTests || selectedTests.length === 0) && { opacity: 0.5 }]}
        activeOpacity={0.9}
      >
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
                  const label = testsById.get(r.id)?.name || r.id;
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
                  return (
                    <View key={r.id} style={{ width: width - 32, paddingRight: 16 }}>
                      <View style={styles.simpleReportCard}>
                        <Text style={styles.reportTitle}>{meta?.name || r.id}</Text>
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
                    reportsSheetRef.current?.dismiss();
                    navigation.navigate('SelectDiagnosis', { caseData });
                  }}
                  style={[styles.primaryButton, styles.sheetPrimaryInRow]}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons name="stethoscope" size={18} color="#fff" />
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
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  navRightCta: { position: 'absolute', right: 16, paddingHorizontal: 16 },
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
  sheetPrimaryInRow: { paddingHorizontal: 16 },
});


