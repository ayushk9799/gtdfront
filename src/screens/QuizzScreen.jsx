import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Dimensions,
    Animated,
    Image,
    ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { API_BASE } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DepartmentIcons } from '../components/DepartmentIcons';
import Video from 'react-native-video';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

const CategorySkeleton = () => {
    const pulseAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const SkeletonBox = ({ style }) => (
        <Animated.View style={[{ backgroundColor: '#E5E7EB', borderRadius: 16, opacity: pulseAnim }, style]} />
    );

    return (
        <View style={styles.listContent}>
            {/* Header Skeleton */}
            <SkeletonBox style={{ width: screenWidth - 24, height: 130, borderRadius: 20, marginBottom: 16 }} />

            {/* Grid Skeleton */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <View key={i} style={[styles.categoryCard, { minHeight: 140, justifyContent: 'center', alignItems: 'center' }]}>
                        <SkeletonBox style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 10 }} />
                        <SkeletonBox style={{ width: '60%', height: 14, marginBottom: 6 }} />
                        <SkeletonBox style={{ width: '40%', height: 10, marginBottom: 12 }} />
                        <SkeletonBox style={{ width: '80%', height: 10, borderRadius: 999 }} />
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function QuizzScreen() {
    const navigation = useNavigation();
    const userData = useSelector((state) => state.user.userData);
    const userId = userData?._id;
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    // Local state instead of Redux
    const [categories, setCategories] = useState([]);
    const [categoriesStatus, setCategoriesStatus] = useState('idle');
    const [nextPreview, setNextPreview] = useState(null);

    // Fetch categories directly
    const fetchCategories = useCallback(async () => {
        setCategoriesStatus('loading');
        try {
            let url = userId
                ? `${API_BASE}/api/quizz/category?userId=${userId}`
                : `${API_BASE}/api/quizz/category`;
            
            // Append language parameter
            url += url.includes('?') ? `&lang=${currentLang}` : `?lang=${currentLang}`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to load categories');
            }
            const data = await res.json();
            setCategories(data.data || []);
            setCategoriesStatus('succeeded');
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategoriesStatus('failed');
        }
    }, [userId]);

    // Fetch next unsolved quiz preview
    const fetchNextPreview = useCallback(async () => {
        try {
            let url = userId
                ? `${API_BASE}/api/quizz/next-preview?userId=${userId}`
                : `${API_BASE}/api/quizz/next-preview`;
            url += url.includes('?') ? `&lang=${currentLang}` : `?lang=${currentLang}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setNextPreview(data.data || null);
            }
        } catch (error) {
            console.error('Error fetching next preview:', error);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            fetchNextPreview();
        }, [fetchCategories, fetchNextPreview])
    );

    const handleCategoryPress = (category) => {
        let initialAttemptedCount = 0;
        let totalQuizzCount = 0;
        const globalAttemptedCount = categories.reduce((sum, cat) => sum + (cat.attemptedCount || 0), 0);

        if (category) {
            initialAttemptedCount = category.attemptedCount || 0;
            totalQuizzCount = category.quizzCount || 0;
        } else {
            initialAttemptedCount = globalAttemptedCount;
            totalQuizzCount = categories.reduce((sum, cat) => sum + (cat.quizzCount || 0), 0);
        }

        navigation.navigate('QuizzPlay', {
            categoryId: category?._id || null,
            categoryName: category ? category.name : 'All Quizzes',
            initialAttemptedCount,
            globalAttemptedCount,
            totalQuizzCount
        });
    };

    const renderHeader = useCallback(() => {
        const totalQuizzCount = categories.reduce((sum, cat) => sum + (cat.quizzCount || 0), 0);

        if (totalQuizzCount === 0) return null;

        const hasPreviewImage = nextPreview?.previewImage;
        const isVideo = hasPreviewImage && /\.(mp4|mov|webm|avi|mkv)$/i.test(nextPreview.previewImage);

        return (
            <>
            <TouchableOpacity
                style={styles.allQuizzesBtnWrapper}
                onPress={() => handleCategoryPress(null)}
                activeOpacity={0.85}
            >
                {hasPreviewImage ? (
                    <View style={styles.previewImageBg}>
                        {isVideo ? (
                            <Video
                                source={{ uri: nextPreview.previewImage }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                                repeat={true}
                                muted={true}
                                paused={false}
                            />
                        ) : (
                            <Image
                                source={{ uri: nextPreview.previewImage }}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        )}
                        {/* Gradient overlay - absolutely positioned */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.85)']}
                            style={styles.previewGradientOverlay}
                        />
                        {/* n/N count - top right corner */}
                        <View style={styles.previewCountBadge}>
                            <Text style={styles.previewCountBadgeText}>
                                {categories.reduce((sum, cat) => sum + (cat.attemptedCount || 0), 0)}/{categories.reduce((sum, cat) => sum + (cat.quizzCount || 0), 0)}
                            </Text>
                        </View>
                        {/* Text content - absolutely positioned at bottom */}
                        <View style={styles.previewTextOverlay}>
                            <View style={styles.previewPlayRow}>
                                <View style={styles.previewPlayCircle}>
                                    <MaterialCommunityIcons name={isVideo ? "play" : "stethoscope"} size={18} color="#FF407D" />
                                </View>
                                <Text style={styles.previewPlayText}>Solve This Case</Text>
                                {nextPreview.department && (
                                    <View style={styles.previewDeptBadge}>
                                        <Text style={styles.previewDeptText}>
                                            {nextPreview.department.charAt(0).toUpperCase() + nextPreview.department.slice(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {nextPreview.complain && (
                                <Text style={styles.previewComplainText} numberOfLines={2}>
                                    {nextPreview.complain}
                                </Text>
                            )}
                        </View>
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#FF407D', '#FF1A5E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.allQuizzesGradientBtn}
                    >
                        <View style={styles.allQuizzesContent}>
                            <View style={styles.allQuizzesIconCircle}>
                                <MaterialCommunityIcons name="play" size={24} color="#FF407D" />
                            </View>
                            <View style={styles.allQuizzesTextGroup}>
                                <Text style={styles.allQuizzesTitle}>{t('quiz.playAll')}</Text>
                                <Text style={styles.allQuizzesSubtitle}>Mix of 1000+ clinical cases</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
                        </View>
                    </LinearGradient>
                )}
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Category</Text>
            </>
        );
    }, [categories, nextPreview, handleCategoryPress]);

    const renderCategoryItem = useCallback(({ item }) => {
        const attemptedCount = item.attemptedCount || 0;
        const totalCount = item.quizzCount || 0;
        const progress = totalCount > 0 ? (attemptedCount / totalCount) * 100 : 0;

        return (
            <Pressable
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item)}
            >
                <View style={styles.categoryCardContent}>
                    <Text style={styles.progressText}>
                        {attemptedCount}/{totalCount}
                    </Text>
                    <View style={styles.categoryIconContainer}>
                        {(() => {
                            const normalizedName = item.name.toLowerCase();
                            const CustomIcon = DepartmentIcons[normalizedName];
                            if (CustomIcon) return <CustomIcon size={68} color={Colors.brand.darkPink} />;
                            return <MaterialCommunityIcons name="brain" size={24} color={Colors.brand.darkPink} />;
                        })()}
                    </View>
                    <View style={styles.categoryTextContainer}>
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </Text>
                    </View>

                    {/* Integrated Progress Bar like DepartmentProgressList */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarWrapper}>
                            <LinearGradient
                                colors={["#FFC1D9", Colors.brand.darkPink]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[styles.progressBarFill, { width: `${progress}%` }]}
                            />
                            <View
                                style={[
                                    styles.progressDot,
                                    { left: `${progress}%` }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }, [handleCategoryPress]);

    const keyExtractor = useCallback((item) => item._id, []);

    const getItemLayout = useCallback((data, index) => {
        const itemHeight = 152; // categoryCard height (140 + 12 margin)
        return {
            length: itemHeight,
            offset: itemHeight * index,
            index
        };
    }, []);

    if (categoriesStatus === 'loading') {
        return (
        <View style={{ flex: 1 }}>
                <SafeAreaView style={styles.container}>
                    <CategorySkeleton />
                </SafeAreaView>
            </View>
        );
    }

    const filteredCategories = categories
        .filter(cat => (cat.quizzCount || 0) > 0)
        .sort((a, b) => (b.quizzCount || 0) - (a.quizzCount || 0));

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
                <View style={styles.screenTitleRow}>
                    <Text style={styles.screenTitle}>{t('quiz.title')}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            const globalAttemptedCount = categories.reduce((sum, cat) => sum + (cat.attemptedCount || 0), 0);
                            const totalQuizzCount = categories.reduce((sum, cat) => sum + (cat.quizzCount || 0), 0);
                            navigation.navigate('QuizzPlay', {
                                categoryId: null,
                                categoryName: 'All Quizzes',
                                initialAttemptedCount: globalAttemptedCount,
                                globalAttemptedCount,
                                totalQuizzCount,
                                startWithSolved: true,
                            });
                        }}
                        style={styles.historyButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="history" size={22} color={Colors.brand.darkPink} />
                        <Text style={styles.historyButtonText}>{t('quiz.history')}</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={filteredCategories}
                    renderItem={renderCategoryItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={renderHeader}
                    numColumns={2}
                    columnWrapperStyle={styles.categoryRow}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={6}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews={true}
                    getItemLayout={getItemLayout}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1E1E1E',
    },
    screenTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    historyButtonText: {
        marginLeft: 5,
        color: Colors.brand.darkPink,
        fontSize: 15,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E1E1E',
        marginTop: 16,
        marginBottom: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#333',
        marginHorizontal: 16,
    },
    listContent: {
        padding: 12,
        paddingTop: 12,
        paddingBottom: 100,
    },
    categoryRow: {
        justifyContent: 'space-between',
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 12,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryCardGradient: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        width: (screenWidth - 36) / 2, // Approximate for "All Quizzes" if it's in the grid
    },
    allQuizzesBtnWrapper: {
        width: screenWidth - 24,
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#FF407D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
    },
    allQuizzesGradientBtn: {
        width: '100%',
    },
    allQuizzesContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    allQuizzesIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    allQuizzesTextGroup: {
        flex: 1,
    },
    allQuizzesTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 2,
    },
    allQuizzesSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: '600',
    },
    // Preview card styles
    previewImageBg: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
    },
    previewGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300 * 0.7,
    },
    previewCountBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    previewCountBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
    previewTextOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    previewDeptBadge: {
        backgroundColor: 'rgba(255, 64, 125, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    previewDeptText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    previewComplainText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 8,
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    previewPlayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewPlayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    previewPlayText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        flex: 1,
    },
    previewCountText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '800',
    },
    categoryCardContent: {
        alignItems: 'center',
        padding: 16,
        justifyContent: 'center',
        height: 140,
    },
    categoryIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 14,
        // backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    categoryTextContainer: {
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#333',
        textAlign: 'center',
    },
    quizzCount: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
        marginTop: 4,
    },
    progressContainer: {
        width: '100%',
        marginTop: 12,
    },
    progressBarWrapper: {
        height: 10,
        backgroundColor: '#ECEFF4',
        borderRadius: 999,
        overflow: 'hidden',
        position: 'relative',
    },
    progressBarFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 999,
    },
    progressDot: {
        position: 'absolute',
        top: -1,
        transform: [{ translateX: -6 }],
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.brand.darkPink,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    progressText: {
        position: 'absolute',
        top: 12,
        right: 12,
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },


});
