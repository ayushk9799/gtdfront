import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StyleSheet,
    ToastAndroid,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../constants/Colors';
import { fetchCategoryCases } from '../store/slices/progressSlice';
import { API_BASE } from '../../constants/Api';
import { loadCaseById, clearCurrentGame, setCaseData, setSelectedTests, setSelectedDiagnosis, setSelectedTreatments } from '../store/slices/currentGameSlice';
import CloudBottom from '../components/CloudBottom';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import { Skeleton } from '../components/Skeleton';
import { styles } from './styles';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

export default function DepartmentCasesScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const { categoryId, categoryName, userId } = route.params || {};
    const themeColors = Colors.light;

    const [loadingCaseId, setLoadingCaseId] = useState(null);
    const premiumSheetRef = useRef(null);

    const { departmentCases, departmentCasesStatus, error } = useSelector((state) => state.progress);
    const { hearts, isPremium } = useSelector((state) => state.user);

    useEffect(() => {
        if (userId && categoryId) {
            dispatch(fetchCategoryCases({ userId, categoryId }));
        }
    }, [dispatch, userId, categoryId]);

    const handleStartCase = async (caseItem, index) => {
        if (loadingCaseId) return;
        const caseId = caseItem.caseId;

        // Check if case is locked (non-premium users can only access first 2 cases, but solved cases are always accessible)
        const isLocked = !isPremium && index >= 2 && caseItem.status !== 'completed';
        if (isLocked) {
            premiumSheetRef.current?.present();
            return;
        }

        try {
            if (!isPremium && hearts <= 0) {
                ToastAndroid.show('You have no hearts left', ToastAndroid.SHORT);
                navigation.navigate('Heart');
                return;
            }

            setLoadingCaseId(caseId);
            dispatch(clearCurrentGame());

            // Load case data
            const resultAction = await dispatch(loadCaseById(caseId));
            if (loadCaseById.fulfilled.match(resultAction)) {
                const loadedData = resultAction.payload;
                const caseData = loadedData.caseData;

                if (caseItem.status === 'completed') {
                    // Fetch completed gameplay for this user and case
                    const res = await fetch(
                        `${API_BASE}/api/gameplays?userId=${encodeURIComponent(userId)}&caseId=${encodeURIComponent(caseId)}&sourceType=case`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        const gameplays = data?.gameplays || [];
                        const completedGameplay = gameplays.find(gp => gp.status === 'completed');

                        if (completedGameplay) {
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

                            // Set selections in Redux
                            dispatch(setSelectedTests(selectedTestIds));
                            dispatch(setSelectedDiagnosis(selectedDiagnosisId));
                            dispatch(setSelectedTreatments(selectedTreatmentIds));

                            // Navigate to ClinicalInsight
                            navigation.navigate('ClinicalInsight', { caseData, from: 'DepartmentCases' });
                            setLoadingCaseId(null);
                            return;
                        }
                    }
                }

                // If not completed or gameplay fetch failed, go to ClinicalInfo
                navigation.navigate('ClinicalInfo');
            } else {
                ToastAndroid.show('Failed to load case', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.warn('Error starting case:', error);
            ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
        } finally {
            setLoadingCaseId(null);
        }
    };

    const renderCaseItem = ({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    marginBottom: 12,
                }
            ]}
            activeOpacity={0.8}
            onPress={() => handleStartCase(item, index)}
        >
            <View style={styles.cardContent}>
                <View style={styles.rowCenterBetween}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: item.status === 'completed' ? '#E8F5E9' : '#F5F5F5',
                                marginRight: 8,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '800',
                                    color: item.status === 'completed' ? '#2E7D32' : '#757575'
                                }}>
                                    {item.status === 'completed' ? 'SOLVED' : 'UNSOLVED'}
                                </Text>
                            </View>
                            {loadingCaseId === item.caseId && <ActivityIndicator size={14} color={Colors.brand.darkPink} />}
                        </View>
                        <Text style={[styles.cardTitle, { color: themeColors.text, fontSize: 16, marginBottom: 2 }]} numberOfLines={1}>
                            {item.caseTitle || 'Medical Case'}
                        </Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                            {item.chiefComplaint}
                        </Text>
                    </View>

                    {item.mainimage ? (
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={{ uri: item.mainimage }}
                                style={localStyles.thumbnail}
                            />
                            {item.status === 'completed' && (
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
                                    {/* <MaterialCommunityIcons name="check-circle" size={32} color="#FFFFFF" /> */}
                                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', opacity: 0.6 }}>Solved</Text>
                                </View>
                            )}
                            {!isPremium && index >= 2 && item.status !== 'completed' && (
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
                            <MaterialCommunityIcons name="medical-bag" size={24} color="#BDC3C7" />
                            {!isPremium && index >= 2 && item.status !== 'completed' && (
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
                                    <MaterialCommunityIcons name="lock" size={32} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

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
                    <Text style={[styles.cardTitle, { color: themeColors.text, fontSize: 20, marginBottom: 0 }]}>
                        {(categoryName || 'Department').charAt(0).toUpperCase() + (categoryName || 'Department').slice(1)}
                    </Text>
                </View>

                {/* Content */}
                {departmentCasesStatus === 'loading' ? (
                    <Skeleton.CasesList count={6} />
                ) : error ? (
                    <View style={[styles.centered, { padding: 20 }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.brand.darkPink} />
                        <Text style={{ marginTop: 12, color: themeColors.icon, textAlign: 'center' }}>{error}</Text>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => dispatch(fetchCategoryCases({ userId, categoryId }))}
                        >
                            <Text style={styles.primaryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : !departmentCases || !departmentCases.cases || departmentCases.cases.length === 0 ? (
                    <View style={[styles.centered, { padding: 20 }]}>
                        <MaterialCommunityIcons name="folder-open-outline" size={48} color={themeColors.icon} />
                        <Text style={{ marginTop: 12, color: themeColors.icon, textAlign: 'center' }}>No cases found for this department</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.screenScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {departmentCases.cases.map((item, index) => (
                            <React.Fragment key={item.caseId}>
                                {renderCaseItem({ item, index })}
                                {/* Show "Premium Cases" divider after the 2nd case for non-premium users */}
                                {index === 1 && departmentCases.cases.length > 2 && (
                                    <View style={localStyles.premiumDivider}>
                                        <View style={localStyles.dividerLine} />
                                        <Text style={localStyles.premiumDividerText}>Premium Cases</Text>
                                        <View style={localStyles.dividerLine} />
                                    </View>
                                )}
                            </React.Fragment>
                        ))}
                        <View style={{ height: 70 }} />
                        <CloudBottom height={160} color={"#FF407D"} style={{ opacity: 0.35 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
            <PremiumBottomSheet
                ref={premiumSheetRef}
                points={[
                    'Unlock all department cases',
                    'Access premium features',
                    'No ads & priority support'
                ]}
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
    premiumDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.brand.darkPink,
        opacity: 0.3,
    },
    premiumDividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        fontWeight: '700',
        color: Colors.brand.darkPink,
    },
});
