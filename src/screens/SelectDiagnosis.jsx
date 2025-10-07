import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

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

export default function SelectDiagnosis() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const caseData = (route?.params && route.params.caseData) ? route.params.caseData : {};
  const diagnosisOptions = caseData?.diagnosisOptions || [];

  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);

  const toggleDiagnosis = (id) => {
    setSelectedDiagnosis((prev) => (prev === id ? null : id));
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
        <Section title={`Select Diagnosis`}>
          <View style={{ gap: 12 }}>
            {diagnosisOptions.map((opt) => {
              const selected = selectedDiagnosis === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  accessibilityRole="button"
                  onPress={() => toggleDiagnosis(opt.id)}
                  style={[styles.diagnosisCard, selected && styles.diagnosisCardSelected]}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.diagnosisName, selected && styles.diagnosisNameSelected]}>
                    {opt.name}
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
        style={[styles.navButton, styles.navLeft, { bottom: Math.max(22, insets.bottom + 25) }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          if (!selectedDiagnosis) return;
          navigation.goBack();
        }}
        disabled={!selectedDiagnosis}
        style={[styles.primaryButton, styles.navRightCta, { bottom: Math.max(22, insets.bottom + 25) }, !selectedDiagnosis && { opacity: 0.5 }]}
        activeOpacity={0.9}
      >
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
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  navRightCta: { position: 'absolute', right: 16, paddingHorizontal: 16 },
});


