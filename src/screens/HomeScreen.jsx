import React, { useEffect, useState } from 'react';
import { useColorScheme, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import inappicon from '../../constants/inappicon.png';
import { styles } from './styles';
import LeagueHeader from './LeagueHeader';
import { CASES_ARRAY } from '../../constants/Api';
import DepartmentProgressList from '../components/DepartmentProgressList';
import { MMKV } from 'react-native-mmkv';
import { useDispatch, useSelector } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { loadCaseById, setUserId } from '../store/slices/currentGameSlice';
import { loadTodaysChallenge, selectCurrentChallenge, selectIsChallengeLoading, selectHasChallengeError, selectChallengeError } from '../store/slices/dailyChallengeSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import departmentIcon from '../../constants/department.png';
import calendarIcon from '../../constants/calendar.png';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
  const navigation = useNavigation();
  const { status: categoriesLoading, items: categories, error: categoriesError } = useSelector(state => state.categories);
  const { userData } = useSelector(state => state.user);
  const [currentUserId, setCurrentUserId] = useState(undefined);
  const dispatch = useDispatch();
  
  // Daily challenge selectors
  const currentChallenge = useSelector(selectCurrentChallenge);
  const isChallengeLoading = useSelector(selectIsChallengeLoading);
  const hasChallengeError = useSelector(selectHasChallengeError);
  const challengeError = useSelector(selectChallengeError);

  useEffect(() => {
    try {
      const storage = new MMKV();
      const stored = storage.getString('user');
      console.log("stored", stored);
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
    try {
      await dispatch(loadCaseById(caseId));
      navigation.navigate('ClinicalInfo');
    } catch (_) {}
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
              <View style={styles.badge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
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
                <Text style={[styles.cardDesc, { marginTop: 8 }]}>
                  {currentChallenge?.metadata?.description || 'Solve today\'s case in under 3 tries to keep your streak alive.'}
                </Text>
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  activeOpacity={0.9} 
                  onPress={() => {
                    // Load the daily challenge case data and navigate
                    dispatch(loadCaseById(currentChallenge?._id));
                    navigation.navigate('ClinicalInfo', { caseData: currentChallenge?.caseData });
                  }}
                >
                  <Text style={styles.primaryButtonText}>Solve the case</Text>
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

          <View style={{}}>
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

        {CASES_ARRAY.map((caseItem, index) => (
          <View key={caseItem.caseId} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Image source={inappicon} style={styles.gameImage} />
            <View style={styles.cardContent}>
              <View style={styles.rowCenterBetween}>
                <Text style={[styles.cardTitle, { color: themeColors.text, flex: 1 }]}>{caseItem.caseTitle}</Text>
                {index === 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDesc}>
                {caseItem.steps?.[0]?.data?.chiefComplaint || 'Clinical case study'}
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('ClinicalInfo', { caseData: caseItem })}
              >
                <Text style={styles.primaryButtonText}>Start Case</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


