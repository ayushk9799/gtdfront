import React from 'react';
import { useColorScheme, View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import LeagueHeader from './LeagueHeader';

const DUMMY = [
  {
    dateLabel: '5th October 2025',
    items: [
      {
        title: 'Essential hypertension',
        summary:
          'A middle-aged man with chest discomfort and subtle ECG changes challenges your diagnostic skills.',
      },
      {
        title: 'Community-acquired bacterial pneumonia (right lower lobe)',
        summary:
          'Acute dyspnea with pleuritic pain and fever. Exam suggests unilateral basal changes. ABG shows mild hypoxemia. CXR and CT refine the cause; PE',
      },
      {
        title: 'Displaced supracondylar humerus fracture',
        summary:
          'A child presents with arm pain and swelling after a fall onto an outstretched hand. Evaluate for vascular compromise and functional loss. Decide between',
      },
    ],
  },
  {
    dateLabel: '4th October 2025',
    items: [
      {
        title: 'Upper gastrointestinal bleeding due to peptic ulcer',
        summary:
          'A 58-year-old arrives with hematemesis, melena, hypotension, and confusion after heavy NSAID use. Stabilize airway and',
      },
    ],
  },
];

export default function LearningScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const totalCount = DUMMY.reduce((sum, sec) => sum + sec.items.length, 0);

  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LeagueHeader onPressPro={() => {}} />
      <ScrollView contentContainerStyle={styles.learnScroll}>
        <View style={styles.learnHeaderRow}>
          <Text style={[styles.learnHeaderCount, { color: themeColors.text }]}>{totalCount} Learnings</Text>
          <Text style={styles.learnHeaderMenu}>⋮</Text>
        </View>

        {DUMMY.map((section, idx) => (
          <View key={idx} style={styles.learnSection}>
            <Text style={[styles.learnDate, { color: themeColors.text }]}>{section.dateLabel}</Text>

            {section.items.map((item, i) => (
              <View
                key={i}
                style={[styles.learnCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              >
                <View style={styles.learnCardRow}>
                  <View style={styles.learnCardTextWrap}>
                    <Text style={[styles.learnTitle, { color: themeColors.text }]}>{item.title}</Text>
                    <Text style={styles.learnSummary}>{item.summary}</Text>
                  </View>
                  <Image source={inappicon} style={styles.learnThumb} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  learnScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, flexGrow: 1 },
  learnHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  learnHeaderCount: { fontSize: 32, fontWeight: '800' },
  learnHeaderMenu: { fontSize: 26, opacity: 0.7 },
  learnSection: { marginBottom: 24 },
  learnDate: { fontSize: 18, fontWeight: '800', color: '#3B5B87', marginBottom: 12 },
  learnCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#1E88E5',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  learnCardRow: { flexDirection: 'row', alignItems: 'center' },
  learnCardTextWrap: { flex: 1, paddingRight: 12 },
  learnTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  learnSummary: { fontSize: 14, lineHeight: 21, color: '#3F5161', opacity: 0.95 },
  learnThumb: {
    width: 84,
    height: 64,
    borderRadius: 12,
    marginLeft: 8,
    resizeMode: 'cover',
    backgroundColor: '#F3F6FA',
  },
});


