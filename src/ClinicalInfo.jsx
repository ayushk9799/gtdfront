import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, Dimensions, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@Colors.jsx';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// Match the app's subtle pink gradient
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

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
      <View style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.border }
      ]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
          <ECGUnderline />
        </View>
        <View>{children}</View>
      </View>
    </View>
  );
}

function PatientInfo() {
  return (
    <Section title="Patient Info">
      Age: 32, Sex: Female. Chief complaint: intermittent fever and cough for 5 days.
    </Section>
  );
}

function Vitals() {
  return (
    <Section title="Vitals">
      Temp 38.3°C, HR 96 bpm, BP 118/72 mmHg, RR 18/min, SpO2 97% on room air.
    </Section>
  );
}

function History() {
  return (
    <Section title="History">
      Onset gradual, sore throat, mild fatigue. No recent travel, no chronic conditions.
    </Section>
  );
}

function PhysicalExam() {
  return (
    <Section title="Physical Examination">
      <BulletItem>Alert and oriented</BulletItem>
      <BulletItem>Mild pharyngeal erythema</BulletItem>
      <BulletItem>Lungs clear to auscultation</BulletItem>
      <BulletItem>No rashes</BulletItem>
    </Section>
  );
}

function FieldRow({ label, value }) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: themeColors.text }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: themeColors.text }]}>{value}</Text>
    </View>
  );
}

function BulletItem({ children }) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={[styles.bulletText, { color: themeColors.text }]}>{children}</Text>
    </View>
  );
}

function StatTile({ label, value }) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.statTile, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}> 
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoColumn({ icon, label, value }) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.infoCol}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.brand.darkPink} />
      <Text style={[styles.infoLabel, { color: '#687076' }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: themeColors.text }]}>{value}</Text>
    </View>
  );
}

function TipCard({ title, subtitle, cta }) {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={[styles.tipCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}> 
      <View style={styles.tipRow}>
        <Image source={require('../constants/inappicon.png')} style={styles.tipImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>{title}</Text>
          <Text style={styles.tipSubtitle}>{subtitle}</Text>
          {cta ? <Text style={styles.tipCta}>{cta}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export default function ClinicalInfo() {
  const { width } = Dimensions.get('window');
  const [index, setIndex] = useState(0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const scrollRef = useRef(null);
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
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const x = e?.nativeEvent?.contentOffset?.x || 0;
          const i = Math.round(x / width);
          if (i !== index) setIndex(i);
        }}
        contentContainerStyle={[styles.carousel, { width: width * 4 }]}
      >
        <View style={[styles.slide, { width }]}>
          <Section title="Basic Info & Chief Complaint">
            <Image source={require('../constants/inappicon.png')} style={styles.heroImage} />
            <View style={styles.infoGrid}>
              <InfoColumn icon="badge-account" label="Name" value="Lina" />
              <InfoColumn icon="gender-female" label="Gender" value="Female" />
              <InfoColumn icon="calendar" label="Age" value="2 Y" />
            </View>
            <View style={styles.subHeaderRow}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={Colors.brand.darkPink} />
              <Text style={styles.subHeaderText}>Chief Complaints</Text>
            </View>
            <Text style={styles.chiefText}>Frequent watery stools for 2 days</Text>
            <TipCard title="Learn as you play" subtitle="Unlock Mentor mode and get step-by-step teaching during the case. Understand why each choice matters — not just the final" />
          </Section>
        </View>
        <View style={[styles.slide, { width }]}>
          <Section title="Vitals">
            <View style={styles.statsRow}>
              <StatTile icon="thermometer" label="Temperature" value="37.2°C (98.96°F)" />
              <StatTile icon="heart" label="Heart Rate" value="132 bpm" />
              <StatTile icon="blood-bag" label="Blood Pressure" value="88/54 mmHg" />
              <StatTile icon="lungs" label="Respiratory Rate" value="28/min" />
              <StatTile icon="oxygen-tank" label="Oxygen Saturation" value="99%" />
              <StatTile icon="scale-bathroom" label="Weight" value="12 kg" />
            </View>
            <TipCard title="Never feel lost in a case" subtitle="Your Mentor guides you through every step — explaining tests, diagnoses, and treatments as you solve the case." />
          </Section>
        </View>
        <View style={[styles.slide, { width }]}>
          <Section title="History">
            <BulletItem>Onset gradual</BulletItem>
            <BulletItem>Sore throat</BulletItem>
            <BulletItem>Mild fatigue</BulletItem>
            <BulletItem>No recent travel</BulletItem>
            <BulletItem>No chronic conditions</BulletItem>
            <BulletItem>Fully vaccinated including rotavirus</BulletItem>
            <BulletItem>Daycare attendance</BulletItem>
            <BulletItem>No recent antibiotic use</BulletItem>
            <BulletItem>Normal growth and development</BulletItem>
            <BulletItem>No prior hospitalizations</BulletItem>
            <TipCard title="Choose your path" subtitle="Hard mode = solve on your own. Guided mode = learn with Mentor at your side. Turn every case into a mini-lesson." cta="Unlock for 300 coins" />
          </Section>
        </View>
        <View style={[styles.slide, { width }]}>
          <Section title="Physical Examination">
            <BulletItem>Alert and oriented</BulletItem>
            <BulletItem>Mild pharyngeal erythema</BulletItem>
            <BulletItem>Lungs clear to auscultation</BulletItem>
            <BulletItem>No rashes</BulletItem>
          </Section>
        </View>
      </ScrollView>
      <View style={[styles.dotsContainer, { bottom: Math.max(70, insets.bottom + 20) }]} pointerEvents="none">
        {[0,1,2,3].map((d) => (
          <View
            key={d}
            style={[
              styles.dot,
              { backgroundColor: d === index ? Colors.brand.darkPink : 'rgba(0,0,0,0.2)' },
            ]}
          />
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => scrollRef.current?.scrollTo({ x: width * Math.max(0, index - 1), animated: true })}
        style={[styles.navButton, styles.navLeft, { bottom: Math.max(22, insets.bottom + 10) }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => scrollRef.current?.scrollTo({ x: width * Math.min(3, index + 1), animated: true })}
        style={[styles.navButton, styles.navRight, { bottom: Math.max(22, insets.bottom + 10) }]}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chevron-right" size={28} color={Colors.brand.darkPink} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  carousel: { },
  slide: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, height: '100%', justifyContent: 'center', alignItems: 'stretch' },
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
  },
  sectionHeader: { alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  ecgSvg: { marginTop: 6, marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 20, color: '#333' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '800', opacity: 0.9 },
  fieldValue: { fontSize: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brand.darkPink, marginTop: 6, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 110,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
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
  heroImage: { width: '100%', height: 150, borderRadius: 16, marginBottom: 14, resizeMode: 'cover' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoLabel: { marginTop: 6, fontSize: 12, fontWeight: '800' },
  infoValue: { marginTop: 2, fontSize: 16, fontWeight: '800' },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subHeaderText: { fontSize: 14, fontWeight: '800', color: '#11181C' },
  chiefText: { marginTop: 6, fontSize: 16, fontWeight: '800' },
  tipCard: { borderWidth: 1, borderRadius: 14, marginTop: 16, padding: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipImage: { width: 44, height: 44, borderRadius: 8, resizeMode: 'contain' },
  tipTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tipSubtitle: { fontSize: 12, color: '#333' },
  tipCta: { marginTop: 8, fontSize: 14, fontWeight: '800', color: Colors.brand.blue },
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
});


