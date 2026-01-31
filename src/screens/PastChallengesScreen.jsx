import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    useColorScheme,
    InteractionManager,
    StyleSheet,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MMKV } from 'react-native-mmkv';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import { Skeleton } from '../components/Skeleton';
import { Colors } from '../../constants/Colors';
import { API_BASE } from '../../constants/Api';
import { setCaseData, setSelectedTests, setSelectedDiagnosis, setSelectedTreatments } from '../store/slices/currentGameSlice';
import CloudBottom from '../components/CloudBottom';
import { styles } from './styles';


const storage = new MMKV();
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

export default function PastChallengesScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors.light;
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { isPremium } = useSelector((state) => state.user);

    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loadingChallenge, setLoadingChallenge] = useState(null);
    const [lastDate, setLastDate] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    // Bottom sheet for already completed challenges
    const completedSheetRef = useRef(null);
    const premiumSheetRef = useRef(null);
    const [completedChallengeData, setCompletedChallengeData] = useState(null);
    const [completedGameplayData, setCompletedGameplayData] = useState(null);
    const snapPoints = useMemo(() => ['40%'], []);

    // Get user ID from storage (deferred to avoid blocking navigation)
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            try {
                const stored = storage.getString('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    const uid = u?.userId || u?._id || u?.id;
                    if (uid) setCurrentUserId(uid);
                }
            } catch (_) { }
        });
        return () => task.cancel();
    }, []);

    // Fetch past challenges (initial load)
    const fetchPastChallenges = useCallback(async () => {
        if (!currentUserId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/daily-challenge?limit=10&sort=-date&userId=${currentUserId}`);
            if (!res.ok) throw new Error('Failed to load past challenges');
            const data = await res.json();
            setChallenges(data.challenges || []);
            setLastDate(data.pagination?.lastDate || null);
            setHasMore(data.pagination?.hasMore || false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    // Load more challenges (pagination)
    const loadMoreChallenges = useCallback(async () => {
        if (!hasMore || loadingMore || !lastDate || !currentUserId) return;

        setLoadingMore(true);
        try {
            const res = await fetch(`${API_BASE}/api/daily-challenge?limit=10&sort=-date&lastDate=${lastDate}&userId=${currentUserId}`);
            if (!res.ok) throw new Error('Failed to load more challenges');
            const data = await res.json();

            setChallenges(prev => [...prev, ...(data.challenges || [])]);
            setLastDate(data.pagination?.lastDate || null);
            setHasMore(data.pagination?.hasMore || false);
        } catch (err) {
            console.warn('Failed to load more:', err.message);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastDate, currentUserId]);

    // Defer API call until after navigation animation completes and userId is available
    useEffect(() => {
        if (!currentUserId) return;
        const task = InteractionManager.runAfterInteractions(() => {
            fetchPastChallenges();
        });
        return () => task.cancel();
    }, [fetchPastChallenges, currentUserId]);

    // Handle viewing insights for completed challenge
    const handleViewInsights = () => {
        if (!completedChallengeData?.caseData) return;

        completedSheetRef.current?.dismiss();

        // Set case data
        dispatch(setCaseData({
            dailyChallengeId: completedChallengeData._id,
            caseData: completedChallengeData.caseData,
            sourceType: 'dailyChallenge',
            isBackdatePlay: false,
        }));

        // Convert gameplay indices to IDs using caseData
        if (completedGameplayData?.selections) {
            const caseData = completedChallengeData.caseData;
            const selections = completedGameplayData.selections;

            // Convert test indices to testIds
            const availableTests = caseData?.steps?.[1]?.data?.availableTests || [];
            const selectedTestIds = (selections.testIndices || []).map(idx => availableTests[idx]?.testId).filter(Boolean);
            dispatch(setSelectedTests(selectedTestIds));

            // Convert diagnosis index to diagnosisId
            const diagnosisOptions = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
            const selectedDiagnosisId = selections.diagnosisIndex != null ? diagnosisOptions[selections.diagnosisIndex]?.diagnosisId : null;
            dispatch(setSelectedDiagnosis(selectedDiagnosisId));

            // Convert treatment indices to treatmentIds
            const step4 = caseData?.steps?.[3]?.data || {};
            const treatmentOptions = step4?.treatmentOptions || {};
            const flatTreatments = [
                ...(treatmentOptions.medications || []),
                ...(treatmentOptions.surgicalInterventional || []),
                ...(treatmentOptions.nonSurgical || []),
                ...(treatmentOptions.psychiatric || []),
            ];
            const selectedTreatmentIds = (selections.treatmentIndices || []).map(idx => flatTreatments[idx]?.treatmentId).filter(Boolean);
            dispatch(setSelectedTreatments(selectedTreatmentIds));
        }

        navigation.navigate('ClinicalInsight', {
            caseData: completedChallengeData.caseData,
            from: 'PastChallenges',
        });
    };

    // Handle challenge selection
    const handleSelectChallenge = async (challenge) => {
        if (!currentUserId) return;

        setLoadingChallenge(challenge.date);

        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const url = new URL(`${API_BASE}/api/daily-challenge/${challenge.date}`);
            url.searchParams.set('timezone', userTimezone);
            url.searchParams.set('userId', currentUserId);

            const res = await fetch(url.toString());
            const data = await res.json();

            if (!res.ok) {
                if (data.alreadyCompleted && data.challenge) {
                    // Show bottom sheet with option to view insights
                    setCompletedChallengeData(data.challenge);
                    setCompletedGameplayData(data.gameplay);
                    setTimeout(() => {
                        completedSheetRef.current?.present();
                    }, 100);
                } else if (data.premiumRequired) {
                    premiumSheetRef.current?.present();
                } else {
                    alert(data.message || 'Unable to load challenge');
                }
                return;
            }

            // Set case data with isBackdatePlay flag
            dispatch(setCaseData({
                dailyChallengeId: data.challenge._id,
                caseData: data.challenge.caseData,
                sourceType: 'dailyChallenge',
                isBackdatePlay: data.isBackdate && data.isPremiumAccess,
            }));

            navigation.navigate('ClinicalInfo');
        } catch (err) {
            alert('Failed to load challenge: ' + err.message);
        } finally {
            setLoadingChallenge(null);
        }
    };

    // Get today's date for comparison
    const today = new Date().toISOString().split('T')[0];

    // Filter out today's challenge and future dates
    const pastChallenges = challenges.filter(c => c.date < today);

    // Format date to "dd Month yyyy" (e.g., "16 January 2026")
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const renderChallengeItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    marginBottom: 12,
                    opacity: loadingChallenge === item.date ? 0.6 : 1,
                }
            ]}
            activeOpacity={0.8}
            onPress={() => handleSelectChallenge(item)}
            disabled={loadingChallenge !== null}
        >
            <View style={styles.cardContent}>
                <View style={styles.rowCenterBetween}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: themeColors.icon }}>{formatDate(item.date)}</Text>
                            {loadingChallenge === item.date && (
                                <ActivityIndicator size={12} color={Colors.brand.darkPink} style={{ marginLeft: 8 }} />
                            )}
                        </View>
                        <Text style={[styles.cardTitle, { color: themeColors.text, fontSize: 16, marginBottom: 2 }]} numberOfLines={1}>
                            {item.metadata?.title || 'Daily Challenge'}
                        </Text>
                        <Text style={styles.cardDesc} numberOfLines={1}>
                            {item.metadata?.category || 'General'}
                        </Text>
                    </View>
                    {/* Thumbnail Image */}
                    {item.metadata?.mainimage ? (
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={{ uri: item.metadata.mainimage }}
                                style={localStyles.thumbnail}
                            />
                            {item.isCompleted && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', opacity: 0.6 }}>Solved</Text>
                                </View>
                            )}
                            {!isPremium && !item.isCompleted && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <MaterialCommunityIcons name="lock" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[localStyles.thumbnail, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                            <MaterialCommunityIcons name="calendar" size={24} color="#BDC3C7" />
                            {item.isCompleted && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', opacity: 0.6 }}>Solved</Text>
                                </View>
                            )}
                            {!isPremium && !item.isCompleted && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <MaterialCommunityIcons name="lock" size={20} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Footer component with Load More button and decoration
    const renderFooter = () => {
        return (
            <View style={{ paddingBottom: 0 }}>
                {hasMore && (
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            {
                                alignSelf: 'stretch',
                                alignItems: 'center',
                                marginTop: 4,
                                marginBottom: 20,
                                opacity: loadingMore ? 0.7 : 1,
                            }
                        ]}
                        activeOpacity={0.8}
                        onPress={loadMoreChallenges}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <View style={styles.rowCenter}>
                                <ActivityIndicator size="small" color="#FFF" />
                                <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Loading...</Text>
                            </View>
                        ) : (
                            <Text style={styles.primaryButtonText}>Load More Challenges</Text>
                        )}
                    </TouchableOpacity>
                )}
                <View style={{ height: 40 }} />
                <View style={{ marginHorizontal: -12, height: 160 }}>
                    <CloudBottom
                        height={160}
                        color={"#FF407D"}
                        style={{ opacity: 0.35, position: 'relative' }}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={SUBTLE_PINK_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={[styles.flex1, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={[styles.rowCenter, { padding: 16, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.cardTitle, { color: themeColors.text, fontSize: 20, marginBottom: 0 }]}>Past Challenges</Text>
                </View>

                {/* Info Banner */}
                <View style={{ backgroundColor: Colors.brand.lightPink, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.brand.darkPink }}>
                    <View style={styles.rowCenter}>
                        <MaterialCommunityIcons name="information-outline" size={20} color={Colors.brand.darkPink} />
                        <Text style={{ marginLeft: 8, color: themeColors.text, fontSize: 13, flex: 1 }}>
                            Practice mode: Points won't count towards leaderboard or cumulative score
                            <Text style={{ fontWeight: 'bold' }}> Requires Premium</Text>
                        </Text>
                    </View>
                </View>

                {/* Content */}
                {loading ? (
                    <Skeleton.CasesList count={6} />
                ) : error ? (
                    <View style={[styles.centered, { padding: 20 }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.brand.darkPink} />
                        <Text style={{ marginTop: 12, color: themeColors.icon, textAlign: 'center' }}>{error}</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={fetchPastChallenges}>
                            <Text style={styles.primaryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : pastChallenges.length === 0 ? (
                    <View style={[styles.centered, { padding: 20 }]}>
                        <MaterialCommunityIcons name="calendar-blank" size={48} color={themeColors.icon} />
                        <Text style={{ marginTop: 12, color: themeColors.icon, textAlign: 'center' }}>No past challenges available</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pastChallenges}
                        keyExtractor={(item) => item.date}
                        renderItem={renderChallengeItem}
                        contentContainerStyle={[styles.screenScroll, { paddingBottom: 0 }]}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={renderFooter}
                    />
                )}
            </SafeAreaView>

            {/* Bottom Sheet for Already Completed Challenge - Outside SafeAreaView */}
            <BottomSheetModal
                ref={completedSheetRef}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
                )}
                backgroundStyle={{ backgroundColor: themeColors.card, borderRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: themeColors.icon }}
            >
                <BottomSheetView style={{ padding: 24, alignItems: 'center' }}>
                    <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: Colors.brand.lightPink,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}>
                        <MaterialCommunityIcons name="check-circle" size={32} color={Colors.brand.darkPink} />
                    </View>

                    <Text style={[styles.cardTitle, { color: themeColors.text, textAlign: 'center', marginBottom: 8 }]}>
                        Challenge Completed!
                    </Text>

                    <Text style={[styles.cardDesc, { textAlign: 'center', marginBottom: 20 }]}>
                        You've already completed this challenge. Would you like to review your performance?
                    </Text>

                    <TouchableOpacity
                        style={[styles.primaryButton, { alignSelf: 'stretch', alignItems: 'center' }]}
                        onPress={handleViewInsights}
                    >
                        <Text style={styles.primaryButtonText}>View Clinical Insights</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginTop: 12, padding: 8 }}
                        onPress={() => completedSheetRef.current?.dismiss()}
                    >
                        <Text style={{ color: themeColors.icon, fontWeight: '600' }}>Close</Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheetModal>

            {/* Premium Bottom Sheet for backdate access */}
            <PremiumBottomSheet
                ref={premiumSheetRef}
                points={['To play past cases get premium']}
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    thumbnail: {
        width: 84,
        height: 64,
        borderRadius: 12,
        resizeMode: 'cover',
        backgroundColor: '#F3F6FA',
    },
});
