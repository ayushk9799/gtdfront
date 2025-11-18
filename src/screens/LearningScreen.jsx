import React from 'react';
import { useColorScheme, View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import LeagueHeader from './LeagueHeader';
import { LearningDetailSheetForwarded as LearningDetailSheet } from '../components/LearningDetailSheet';
import { useNavigation } from '@react-navigation/native';
import { API_BASE } from '../../constants/Api';
import { MMKV } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { setSelectedTests, setSelectedDiagnosis, setSelectedTreatments, setUserId } from '../store/slices/currentGameSlice';

// Will fetch brief gameplay list for user

export default function LearningScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors.light;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [userId, setUid] = React.useState(undefined);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const detailSheetRef = React.useRef(null);

  const openSheet = (item) => {
    detailSheetRef.current?.present(item);
  };

  const closeSheet = () => {
    detailSheetRef.current?.dismiss();
  };

  React.useEffect(() => {
    // Load user from MMKV and then fetch brief gameplays
    (async () => {
      try {
        const storage = new MMKV();
        const stored = storage.getString('user');
        if (stored) {
          const u = JSON.parse(stored);
          const uid = u?.userId || u?._id || u?.id;
          if (uid) {
            setUid(uid);
            dispatch(setUserId(uid));
            const res = await fetch(`${API_BASE}/api/gameplays/brief?userId=${encodeURIComponent(uid)}`);
            if (!res.ok) {
              const t = await res.text();
              throw new Error(t || `Failed to load gameplays (${res.status})`);
            }
            const data = await res.json();
            const list = Array.isArray(data?.items) ? data.items : [];
            setItems(list);
          }
        }
      } catch (e) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const groupedByDate = React.useMemo(() => {
    const toKeyLabel = (createdAt) => {
      const d = new Date(createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const label = d.toLocaleDateString("en-IN", { month: 'long', day: 'numeric', year: 'numeric' });
      return { key, label };
    };
    const map = new Map();
    items.forEach((it) => {
      const { key, label } = toKeyLabel(it.createdAt);
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key).items.push(it);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([, v]) => v);
  }, [items]);

  const openGameplay = async (gameplayId) => {
    try {
      const res = await fetch(`${API_BASE}/api/gameplays/${encodeURIComponent(gameplayId)}`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to load gameplay (${res.status})`);
      }
      const data = await res.json();
      const gp = data?.gameplay;
      const caseDoc = gp?.caseId || {};
      const caseData = caseDoc?.caseData || {};
      // Map indices -> IDs
      const tests = caseData?.steps?.[1]?.data?.availableTests || [];
      const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
      const step4 = caseData?.steps?.[3]?.data || {};
      const treatmentGroups = step4?.treatmentOptions || {};
      const flatTreatments = [
        ...(treatmentGroups.medications || []),
        ...(treatmentGroups.surgicalInterventional || []),
        ...(treatmentGroups.nonSurgical || []),
        ...(treatmentGroups.psychiatric || []),
      ];

      const selectedTestIds = (gp?.selections?.testIndices || [])
        .map((i) => (typeof i === 'number' && tests[i] ? tests[i].testId : null))
        .filter(Boolean);
      const selectedDiagnosisId = (typeof gp?.selections?.diagnosisIndex === 'number' && diags[gp.selections.diagnosisIndex])
        ? diags[gp.selections.diagnosisIndex].diagnosisId
        : null;
      const selectedTreatmentIds = (gp?.selections?.treatmentIndices || [])
        .map((i) => (typeof i === 'number' && flatTreatments[i] ? flatTreatments[i].treatmentId : null))
        .filter(Boolean);

      dispatch(setSelectedTests(selectedTestIds));
      dispatch(setSelectedDiagnosis(selectedDiagnosisId));
      dispatch(setSelectedTreatments(selectedTreatmentIds));

      navigation.navigate('ClinicalInsight', { caseData });
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      {/* <LeagueHeader onPressPro={() => {}} /> */}
      <ScrollView contentContainerStyle={styles.learnScroll}>
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ActivityIndicator color={Colors.brand.darkPink} />
            <Text style={[styles.learnSummary, { marginTop: 6 }]}>Loading…</Text>
          </View>
        )}
        {!loading && error && (
          <Text style={[styles.learnSummary, { color: '#C62828' }]}>{error}</Text>
        )}
        {!loading && !error && groupedByDate.map((group, idx) => (
          <View key={idx} style={{...styles.learnSection}}>
            <Text style={[styles.learnDate, { color: themeColors.text }]}>{group.label}</Text>
            {group.items.map((it) => (
              <Pressable
                key={String(it.gameplayId)}
                onPress={() => openGameplay(it.gameplayId)}
                style={[styles.learnCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              >
                <View style={styles.learnCardRow}>
                  <View style={styles.learnCardTextWrap}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.learnTitle, { color: themeColors.text, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{it.case?.title || 'Case'}</Text>
                    </View>
                    <Text style={[styles.learnSummary, { marginTop: 2 }]} numberOfLines={1} ellipsizeMode="tail">{it.case?.correctDiagnosis || ''}</Text>
                    <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#C24467', borderWidth: 1, borderColor: '#D3D9E3' }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ffffff' }} numberOfLines={1} ellipsizeMode="tail">{it.case?.category || 'General'}</Text>
                    </View>
                  </View>
                  <Image source={inappicon} style={styles.learnThumb} />
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <LearningDetailSheet ref={detailSheetRef} themeColors={themeColors} snapPoints={['45%','90%']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  learnScroll: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 120, flexGrow: 1 },
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
  // removed local sheet styles; handled inside component
});


