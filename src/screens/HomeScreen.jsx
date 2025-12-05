import React, { useEffect, useState } from 'react';
import { useColorScheme, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, ToastAndroid } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { status: categoriesLoading, items: categories, error: categoriesError } = useSelector(state => state.categories);
  const { hearts } = useSelector(state => state.user);
  const [currentUserId, setCurrentUserId] = useState(undefined);
  const [isDailyChallengeLoading, setIsDailyChallengeLoading] = useState(false);
  const dispatch = useDispatch();
  const premiumSheetRef = React.useRef(null);

  

  // Daily challenge selectors
  const currentChallenge = useSelector(selectCurrentChallenge);
  const isChallengeLoading = useSelector(selectIsChallengeLoading);
  const hasChallengeError = useSelector(selectHasChallengeError);
  const challengeError = useSelector(selectChallengeError);

  useEffect(() => {
    try {
      const storage = new MMKV();
      const stored = storage.getString('user');
      // console.log("stored", stored);
      if (stored) {
        const u = JSON.parse(stored);
        const uid = u?.userId || u?._id || u?.id;
        if (uid) {
          setCurrentUserId(uid);
          dispatch(setUserId(uid));
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if(categoriesLoading === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch]);

  // Load today's daily challenge on component mount
  useEffect(() => {
    dispatch(loadTodaysChallenge());
  }, [dispatch]);

  const openCaseById = async (caseId) => {
    console.log('caseId', caseId);
    
    try {
      if(hearts <=0) {
        ToastAndroid.show('You have no hearts left', ToastAndroid.SHORT);
        premiumSheetRef.current?.present();
        return;
      }
      await dispatch(loadCaseById(caseId));
      navigation.navigate('ClinicalInfo');
    } catch (_) {}
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
    <SafeAreaView style={styles.flex1} edges={['top','left','right']}>
      <LeagueHeader onPressPro={() => {}} />
      <ScrollView contentContainerStyle={styles.screenScroll}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.cardContent}>
            <View style={styles.rowCenterBetween}>
              <View style={styles.rowCenter}>
                <Image source={calendarIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Daily Challenge</Text>
              </View>
              {/* <View style={styles.badge}>
                <Text style={styles.badgeText}>New</Text>
              </View> */}
            </View>
            
            {isChallengeLoading && (
              <View style={[styles.rowCenter, { marginTop: 8 }]}>
                <ActivityIndicator color={Colors.brand.darkPink} />
                <Text style={[styles.cardDesc, { marginLeft: 8 }]}>Loading today's challenge...</Text>
              </View>
            )}
            
            {hasChallengeError && !isChallengeLoading && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.cardDesc, { color: '#C62828' }]}>
                  {challengeError || 'Failed to load today\'s challenge'}
                </Text>
               
              </View>
            )}
            
            {currentChallenge && !isChallengeLoading && !hasChallengeError && (
              <>
              {currentChallenge?.caseData?.mainimage && 
              <View style={{ width: '100%', height: 200, resizeMode: 'contain', backgroundColor: 'transparent', borderRadius: 16, overflow: 'hidden' }}>
                <Image source={{ uri: currentChallenge?.caseData?.mainimage }} style={{ width: '100%', height: "100%", resizeMode: 'cover', backgroundColor: 'transparent' }} />
              </View>
              }
                <Text style={[styles.cardDesc, { marginTop: 8 }]}>
                  {currentChallenge?.caseData?.caseTitle|| 'Solve today\'s case in under 3 tries to keep your streak alive.'}
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
                    <Text style={styles.primaryButtonText}>Solve the case</Text>
                  )}
                </TouchableOpacity>
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

          <View style={{marginBottom: 120}}>
            <View style={styles.rowCenterBetween}>
              <View style={styles.rowCenter}>
                <Image source={departmentIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                <Text style={[styles.cardTitle, { marginLeft: 8, color: themeColors.text }]}>Departments</Text>
              </View>
            </View>
            {categoriesLoading === 'loading' && (
              <View style={[styles.rowCenter, { marginTop: 8 }]}> 
                <ActivityIndicator color={Colors.brand.darkPink} />
                <Text style={[styles.cardDesc, { marginLeft: 8 }]}>Loading departments…</Text>
              </View>
            )}
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
