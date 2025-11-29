import React from 'react';
import { useColorScheme, View, Text, ScrollView, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import LeagueHeader from './LeagueHeader';
import { LearningDetailSheetForwarded as LearningDetailSheet } from '../components/LearningDetailSheet';
import { useNavigation } from '@react-navigation/native';
import { API_BASE } from '../../constants/Api';
import { MMKV } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { setSelectedTests, setSelectedDiagnosis, setSelectedTreatments, setUserId } from '../store/slices/currentGameSlice';
import CloudBottom from '../components/CloudBottom';

// Will fetch brief gameplay list for user (supports both Case and DailyChallenge)

export default function LearningScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors.light;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
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

  // Helper to get title based on sourceType
  const getItemTitle = (it) => {
    if (it.sourceType === 'dailyChallenge') {
      return it.dailyChallenge?.title || 'Daily Challenge';
    }
    return it.case?.title || 'Case';
  };

  // Helper to get category based on sourceType
  const getItemCategory = (it) => {
    if (it.sourceType === 'dailyChallenge') {
      return it.dailyChallenge?.category || 'Daily';
    }
    return it.case?.category || 'General';
  };

  // Helper to get correct diagnosis based on sourceType
  const getItemDiagnosis = (it) => {
    if (it.sourceType === 'dailyChallenge') {
      return it.dailyChallenge?.correctDiagnosis || '';
    }
    return it.case?.correctDiagnosis || '';
  };

  // Helper to get mainimage based on sourceType
  const getItemMainImage = (it) => {
    if (it.sourceType === 'dailyChallenge') {
      return it.dailyChallenge?.mainimage || null;
    }
    return it.case?.mainimage || null;
  };

  const openGameplay = async (gameplayId) => {
    try {
      const res = await fetch(`${API_BASE}/api/gameplays/${encodeURIComponent(gameplayId)}`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to load gameplay (${res.status})`);
      }
      const data = await res.json();
      const gp = data?.gameplay;
      
      // Handle both case and dailyChallenge gameplays
      const sourceType = gp?.sourceType || 'case';
      let caseData;
      
      if (sourceType === 'dailyChallenge') {
        // For daily challenges, caseData is embedded in the dailyChallengeId document
        const challengeDoc = gp?.dailyChallengeId || {};
        caseData = challengeDoc?.caseData || {};
      } else {
        // For regular cases
        const caseDoc = gp?.caseId || {};
        caseData = caseDoc?.caseData || {};
      }
      
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
        {!loading && !error && groupedByDate.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={styles.emptyStateTitle}>No cases solved yet</Text>
            <Text style={styles.emptyStateDesc}>
              Start solving cases from the Home screen to see your learning history here.
            </Text>
          </View>
        )}
        {!loading && !error && groupedByDate.length > 0 && groupedByDate.map((group, idx) => (
          <View key={idx} style={{...styles.learnSection}}>
            <Text style={[styles.learnDate, { color: themeColors.text }]}>{group.label}</Text>
            {group.items.map((it) => {
              const isDailyChallenge = it.sourceType === 'dailyChallenge';
              return (
                <Pressable
                  key={String(it.gameplayId)}
                  onPress={() => openGameplay(it.gameplayId)}
                  style={[
                    styles.learnCard, 
                    { 
                      backgroundColor: themeColors.card, 
                      borderColor: isDailyChallenge ? '#FFA726' : themeColors.border,
                      borderWidth: isDailyChallenge ? 2 : 1,
                    }
                  ]}
                >
                  <View style={styles.learnCardRow}>
                    <View style={styles.learnCardTextWrap}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.learnTitle, { color: themeColors.text, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                          {getItemTitle(it)}
                        </Text>
                        {isDailyChallenge && (
                          <View style={styles.dailyBadge}>
                            <Text style={styles.dailyBadgeText}>Daily</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.learnSummary, { marginTop: 2 }]} numberOfLines={1} ellipsizeMode="tail">
                        {getItemDiagnosis(it)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ 
                          alignSelf: 'flex-start', 
                          paddingHorizontal: 8, 
                          paddingVertical: 3, 
                          borderRadius: 6, 
                          backgroundColor: isDailyChallenge ? '#FF9800' : '#C24467', 
                          borderWidth: 1, 
                          borderColor: isDailyChallenge ? '#F57C00' : '#D3D9E3' 
                        }}>
                          <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ffffff' }} numberOfLines={1} ellipsizeMode="tail">
                            {getItemCategory(it)}
                          </Text>
                        </View>
                        {isDailyChallenge && it.dailyChallenge?.date && (
                          <Text style={styles.dateLabel}>
                            {it.dailyChallenge.date}
                          </Text>
                        )}
                      </View>
                    </View>
                    {getItemMainImage(it) ? (
                      <Image 
                        source={{ uri: getItemMainImage(it) }} 
                        style={styles.learnThumb} 
                      />
                    ) : (
                      <Image 
                        source={inappicon} 
                        style={styles.learnThumb} 
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={{ height: 100 }} />
        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.35 }} />
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
  dailyBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  dateLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  // removed local sheet styles; handled inside component
});
