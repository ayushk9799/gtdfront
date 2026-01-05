import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useColorScheme, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ToastAndroid, Animated, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';
import DepartmentProgressList from '../components/DepartmentProgressList';
import { MMKV } from 'react-native-mmkv';
import { useDispatch, useSelector } from 'react-redux';
import { loadCaseById, setUserId, setCaseData, setSelectedTests, setSelectedDiagnosis, setSelectedTreatments } from '../store/slices/currentGameSlice';
import { loadTodaysChallenge, selectCurrentChallenge, selectIsChallengeLoading, selectHasChallengeError, selectChallengeError } from '../store/slices/dailyChallengeSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import departmentIcon from '../../constants/department.png';
import calendarIcon from '../../constants/calendar.png';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import { API_BASE } from '../../constants/Api';
import CloudBottom from '../components/CloudBottom';

// Skeleton Loader Component
const SkeletonLoader = ({ width, height, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Daily Challenge Skeleton
const DailyChallengeSkeleton = () => (
  <View style={{ marginTop: 8 }}>
    {/* Image skeleton */}
    <SkeletonLoader width="100%" height={200} borderRadius={16} style={{ marginBottom: 12 }} />
    {/* Title skeleton */}
    <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
    {/* Description skeleton */}
    <SkeletonLoader width="60%" height={14} style={{ marginBottom: 16 }} />
    {/* Button skeleton */}
    <SkeletonLoader width="100%" height={48} borderRadius={24} />
  </View>
);

// Department Card Skeleton
const DepartmentCardSkeleton = () => (
  <View style={skeletonStyles.departmentCard}>
    {/* Icon skeleton */}
    <SkeletonLoader width={48} height={48} borderRadius={12} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      {/* Title skeleton */}
      <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
      {/* Progress bar skeleton */}
      <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 6 }} />
      {/* Progress text skeleton */}
      <SkeletonLoader width="40%" height={12} />
    </View>
  </View>
);

// Departments List Skeleton
const DepartmentsListSkeleton = () => (
  <View style={{ marginTop: 12 }}>
    <DepartmentCardSkeleton />
    <DepartmentCardSkeleton />
    <DepartmentCardSkeleton />
    <DepartmentCardSkeleton />
  </View>
);

const skeletonStyles = StyleSheet.create({
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors.light;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { status: categoriesLoading, items: categories, error: categoriesError } = useSelector(state => state.categories);
  const { hearts, isPremium } = useSelector(state => state.user);
  const [currentUserId, setCurrentUserId] = useState(undefined);
  const [isDailyChallengeLoading, setIsDailyChallengeLoading] = useState(false);
  const [isDailyChallengeCompleted, setIsDailyChallengeCompleted] = useState(false);

  // MMKV storage instance for persisting suggested case
  const storage = React.useMemo(() => new MMKV(), []);

  // 1 hour expiration in milliseconds
  const SUGGESTED_CASE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

  // Load persisted suggested case SYNCHRONOUSLY to prevent race condition
  // Also check if the case has expired (1 hour)
  const [suggestedNextCase, setSuggestedNextCase] = useState(() => {
    try {
      const mmkv = new MMKV();
      const persistedCase = mmkv.getString('suggestedNextCase');
      if (persistedCase) {
        const parsed = JSON.parse(persistedCase);

        // Check if the case has expired (1 hour)
        const savedAt = parsed.savedAt || 0;
        const now = Date.now();
        const elapsed = now - savedAt;

        if (elapsed > SUGGESTED_CASE_EXPIRY_MS) {
          mmkv.delete('suggestedNextCase');
          return null;
        }

        return parsed;
      }
    } catch (error) {
      console.warn('Error loading persisted suggested case:', error);
    }
    return null;
  });

  const dispatch = useDispatch();
  const premiumSheetRef = React.useRef(null);

  // Progress selector for getting next case from departments
  const { status: progressStatus, items: departmentProgress } = useSelector(state => state.progress);

  // Daily challenge selectors
  const currentChallenge = useSelector(selectCurrentChallenge);
  const isChallengeLoading = useSelector(selectIsChallengeLoading);
  const hasChallengeError = useSelector(selectHasChallengeError);
  const challengeError = useSelector(selectChallengeError);

  useEffect(() => {
    try {
      const stored = storage.getString('user');
      if (stored) {
        const u = JSON.parse(stored);
        const uid = u?.userId || u?._id || u?.id;
        if (uid) {
          setCurrentUserId(uid);
          dispatch(setUserId(uid));
        }
      }
    } catch (_) { }
  }, []);

  useEffect(() => {
    if (categoriesLoading === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch]);

  // Load today's daily challenge on component mount
  useEffect(() => {
    dispatch(loadTodaysChallenge());
  }, [dispatch]);

  // Check if daily challenge is completed and get suggested next case
  useEffect(() => {
    const checkDailyChallengeCompletion = async () => {
      if (!currentChallenge?._id || !currentUserId) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/gameplays?userId=${encodeURIComponent(currentUserId)}&dailyChallengeId=${encodeURIComponent(currentChallenge._id)}&sourceType=dailyChallenge`
        );

        if (!res.ok) return;

        const data = await res.json();
        const gameplays = data?.gameplays || [];
        const completedGameplay = gameplays.find(gp => gp.status === 'completed');

        setIsDailyChallengeCompleted(!!completedGameplay);
      } catch (error) {
        console.warn('Error checking daily challenge completion:', error);
      }
    };

    checkDailyChallengeCompletion();
  }, [currentChallenge, currentUserId]);

  // Get a random next case from departments when:
  // 1. Daily challenge is completed, OR
  // 2. No challenge available (API succeeded with null challenge), OR
  // 3. Challenge loading failed (meaning no challenge for today)
  const challengeStatus = useSelector(state => state.dailyChallenge.status);
  const noDailyChallengeAvailable = (challengeStatus === 'succeeded' && !currentChallenge) || challengeStatus === 'failed';
  // Only show suggested case when daily challenge is completed or no challenge available
  const shouldShowSuggestedCase = isDailyChallengeCompleted || (noDailyChallengeAvailable || hasChallengeError);

  // Pick a random suggested case only if we don't have one persisted
  useEffect(() => {

    // Skip if we already have a suggested case (from persistence or previous pick)
    if (suggestedNextCase) {
      return;
    }

    if (shouldShowSuggestedCase && progressStatus === 'succeeded' && Array.isArray(departmentProgress)) {
      // Filter departments that have unsolved cases
      const deptsWithCases = departmentProgress.filter(
        dept => Array.isArray(dept.unsolvedCases) && dept.unsolvedCases.length > 0
      );

      if (deptsWithCases.length > 0) {
        // Pick a random department
        const randomDept = deptsWithCases[Math.floor(Math.random() * deptsWithCases.length)];
        const nextCase = randomDept.unsolvedCases[0];

        if (nextCase) {
          const newSuggestedCase = {
            caseId: nextCase.caseId,
            caseTitle: nextCase.caseTitle || 'Medical Case',
            mainimage: nextCase.mainimage || null,
            departmentName: randomDept.name || 'Department',
            savedAt: Date.now(), // Timestamp for 1-hour expiration
          };

          setSuggestedNextCase(newSuggestedCase);

          // Persist the suggested case to MMKV (with timestamp)
          try {
            storage.set('suggestedNextCase', JSON.stringify(newSuggestedCase));
          } catch (error) {
            console.warn('Error persisting suggested case:', error);
          }
        }
      }
    }
  }, [shouldShowSuggestedCase, progressStatus, departmentProgress, suggestedNextCase]);

  // Function to clear suggested case (call this when user completes the case)
  const clearSuggestedCase = useCallback(() => {
    setSuggestedNextCase(null);
    try {
      storage.delete('suggestedNextCase');
    } catch (error) {
      console.warn('Error clearing suggested case:', error);
    }
  }, [storage]);

  // Check if the suggested case was completed when screen regains focus
  useFocusEffect(
    useCallback(() => {
      const checkIfSuggestedCaseCompleted = async () => {
        if (!suggestedNextCase?.caseId || !currentUserId) return;

        try {
          // Check if there's a completed gameplay for this specific case
          const res = await fetch(
            `${API_BASE}/api/gameplays?userId=${encodeURIComponent(currentUserId)}&caseId=${encodeURIComponent(suggestedNextCase.caseId)}&sourceType=case`
          );

          if (!res.ok) return;

          const data = await res.json();
          const gameplays = data?.gameplays || [];
          const completedGameplay = gameplays.find(gp => gp.status === 'completed');

          if (completedGameplay) {
            clearSuggestedCase();
          }
        } catch (error) {
          console.warn('Error checking suggested case completion:', error);
        }
      };

      checkIfSuggestedCaseCompleted();
    }, [suggestedNextCase?.caseId, currentUserId, clearSuggestedCase])
  );

  const openCaseById = async (caseId) => {
    try {
      if (!isPremium && hearts <= 0) {
        ToastAndroid.show('You have no hearts left', ToastAndroid.SHORT);
        navigation.navigate('Heart');
        return;
      }
      await dispatch(loadCaseById(caseId));
      navigation.navigate('ClinicalInfo');
    } catch (_) { }
  };

  // Handle daily challenge press - check if already completed
  const handleDailyChallengePress = async () => {
    if (!currentChallenge?._id || !currentUserId) {
      // Fallback to normal flow if no challenge or user
      dispatch(setCaseData({
        dailyChallengeId: currentChallenge?._id,
        caseData: currentChallenge?.caseData,
        sourceType: 'dailyChallenge'
      }));
      navigation.navigate('ClinicalInfo');
      return;
    }

    setIsDailyChallengeLoading(true);

    try {
      // Check if there's an existing gameplay for this daily challenge
      const res = await fetch(
        `${API_BASE}/api/gameplays?userId=${encodeURIComponent(currentUserId)}&dailyChallengeId=${encodeURIComponent(currentChallenge._id)}&sourceType=dailyChallenge`
      );

      if (!res.ok) {
        throw new Error('Failed to check gameplay status');
      }

      const data = await res.json();
      const gameplays = data?.gameplays || [];
      const completedGameplay = gameplays.find(gp => gp.status === 'completed');

      if (completedGameplay) {
        // Already completed - load selections and navigate to ClinicalInsight
        const caseData = currentChallenge?.caseData || {};

        // Map indices -> IDs for selections
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

        const selectedTestIds = (completedGameplay?.selections?.testIndices || [])
          .map((i) => (typeof i === 'number' && tests[i] ? tests[i].testId : null))
          .filter(Boolean);
        const selectedDiagnosisId = (typeof completedGameplay?.selections?.diagnosisIndex === 'number' && diags[completedGameplay.selections.diagnosisIndex])
          ? diags[completedGameplay.selections.diagnosisIndex].diagnosisId
          : null;
        const selectedTreatmentIds = (completedGameplay?.selections?.treatmentIndices || [])
          .map((i) => (typeof i === 'number' && flatTreatments[i] ? flatTreatments[i].treatmentId : null))
          .filter(Boolean);

        // Set case data and selections in Redux
        dispatch(setCaseData({
          dailyChallengeId: currentChallenge?._id,
          caseData: caseData,
          sourceType: 'dailyChallenge'
        }));
        dispatch(setSelectedTests(selectedTestIds));
        dispatch(setSelectedDiagnosis(selectedDiagnosisId));
        dispatch(setSelectedTreatments(selectedTreatmentIds));

        // Navigate to ClinicalInsight to review the completed case
        navigation.navigate('ClinicalInsight', { caseData, from: 'HomeScreen' });

        ToastAndroid.show('You\'ve already completed today\'s challenge!', ToastAndroid.SHORT);
      } else {
        // Not completed - proceed with normal flow
        dispatch(setCaseData({
          dailyChallengeId: currentChallenge?._id,
          caseData: currentChallenge?.caseData,
          sourceType: 'dailyChallenge'
        }));
        navigation.navigate('ClinicalInfo');
      }
    } catch (error) {
      // On error, fallback to normal flow
      console.warn('Error checking daily challenge status:', error);
      dispatch(setCaseData({
        dailyChallengeId: currentChallenge?._id,
        caseData: currentChallenge?.caseData,
        sourceType: 'dailyChallenge'
      }));
      navigation.navigate('ClinicalInfo');
    } finally {
      setIsDailyChallengeLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
      <LeagueHeader onPressPro={() => { }} />
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.rowCenterBetween}>
              <View style={styles.rowCenter}>
                <Image source={calendarIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Daily Challenge</Text>
              </View>
              {isDailyChallengeCompleted && (
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: '#2E7D32',
                }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ffffff' }}>Already Played ✓</Text>
                </View>
              )}
            </View>

            {isChallengeLoading && <DailyChallengeSkeleton />}

            {hasChallengeError && !isChallengeLoading && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.cardDesc, { color: '#C62828' }]}>
                  {challengeError || 'Failed to load today\'s challenge'}
                </Text>

              </View>
            )}

            {currentChallenge && !isChallengeLoading && !hasChallengeError && (
              <>
                {isDailyChallengeCompleted ? (
                  <>
                    <Text style={[styles.cardDesc, { marginTop: 8, fontSize: 15, color: '#2E7D32' }]}>
                      Your daily challenge is completed! 🎉
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryButton, isDailyChallengeLoading && { opacity: 0.7 }]}
                      activeOpacity={0.9}
                      onPress={handleDailyChallengePress}
                      disabled={isDailyChallengeLoading}
                    >
                      {isDailyChallengeLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Review Challenge</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {currentChallenge?.caseData?.mainimage &&
                      <View style={{ width: '100%', height: 200, resizeMode: 'contain', backgroundColor: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
                        <Image source={{ uri: currentChallenge?.caseData?.mainimage }} style={{ width: '100%', height: "100%", resizeMode: 'cover', backgroundColor: 'transparent' }} />
                      </View>
                    }
                    <Text style={[styles.cardDesc, { marginTop: 8, fontFamily: 'Artifika-Regular' , fontSize: 15}]}>
                      {currentChallenge?.caseData?.caseTitle || 'Solve today\'s case in under 3 tries to keep your streak alive.'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.primaryButton, isDailyChallengeLoading && { opacity: 0.7 }]}
                      activeOpacity={0.9}
                      onPress={handleDailyChallengePress}
                      disabled={isDailyChallengeLoading}
                    >
                      {isDailyChallengeLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Solve Today's Challenge</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {!currentChallenge && !isChallengeLoading && !hasChallengeError && (
              <>
                <Text style={[styles.cardDesc, { marginTop: 8 }]}>
                  No daily challenge available for today. Check back tomorrow!
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { opacity: 0.6 }]}
                  activeOpacity={0.9}
                  disabled={true}
                >
                  <Text style={styles.primaryButtonText}>No Challenge Today</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Continue Solving Card - Shows when daily challenge is completed OR no challenge available */}
        {shouldShowSuggestedCase && suggestedNextCase && (
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 16 }]}>
            <View style={styles.cardContent}>
              <View style={styles.rowCenterBetween}>
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons name="medical-bag" size={28} color={Colors.brand.darkPink} />
                  <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Solve the Case</Text>
                </View>
                <View style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: '#C24467',
                  borderWidth: 1,
                  borderColor: '#D3D9E3'
                }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ffffff' }} numberOfLines={1} ellipsizeMode="tail">
                    {suggestedNextCase.departmentName.charAt(0).toUpperCase() + suggestedNextCase.departmentName.slice(1)}
                  </Text>
                </View>
              </View>

              {suggestedNextCase.mainimage && (
                <View style={{ width: '100%', height: 200, backgroundColor: '#F5F5F5', borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>
                  <Image
                    source={{ uri: suggestedNextCase.mainimage }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                </View>
              )}

              <Text style={[styles.cardDesc, { marginTop: 12, fontSize: 15 }]} numberOfLines={2}>
                {suggestedNextCase.caseTitle}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={() => openCaseById(suggestedNextCase.caseId)}
              >
                <Text style={styles.primaryButtonText}>Start Case</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ marginBottom: 120 }}>
          <View style={styles.rowCenterBetween}>
            <View style={styles.rowCenter}>
              <Image source={departmentIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
              <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Departments</Text>
            </View>
          </View>
          {categoriesLoading === 'loading' && <DepartmentsListSkeleton />}
          {categoriesError && categoriesLoading !== 'loading' && (
            <Text style={[styles.cardDesc, { color: '#C62828', marginTop: 8 }]}>{categoriesError}</Text>
          )}
          {categoriesLoading !== 'loading' && !categoriesError && (
            <DepartmentProgressList
              userId={currentUserId}
              themeColors={themeColors}
              onStartCase={openCaseById}
            />
          )}
        </View>
        <PremiumBottomSheet ref={premiumSheetRef} />


        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
