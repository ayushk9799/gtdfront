import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchQuizzesByCategory,
    fetchMoreQuizzes,
    resetQuizState,
    submitQuizzAttempt,
    selectQuizzStatus,
    selectQuizzError,
    selectQuizzHasMore,
    selectQuizzIsFetchingMore,
} from '../store/slices/quizzSlice';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

const SkeletonCard = () => {
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
        <Animated.View style={[{ backgroundColor: '#E5E7EB', borderRadius: 8, opacity: pulseAnim }, style]} />
    );

    return (
        <View style={styles.page}>
            <View style={styles.quizScrollContent}>
                <View style={styles.skeletonQuestionCard}>
                    {/* Dept Placeholder */}
                    <SkeletonBox style={{ width: 100, height: 12, marginBottom: 12 }} />

                    {/* Complain Placeholder */}
                    <SkeletonBox style={{ width: '90%', height: 18, marginBottom: 8 }} />
                    <SkeletonBox style={{ width: '60%', height: 18, marginBottom: 20 }} />

                    {/* Image Placeholder */}
                    <SkeletonBox style={{ width: '100%', height: 280, borderRadius: 12, marginBottom: 20 }} />

                    {/* Options Placeholders */}
                    <View style={styles.optionsContainer}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={styles.skeletonOptionRow}>
                                <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
                                <SkeletonBox style={{ flex: 1, height: 16, borderRadius: 4 }} />
                            </View>
                        ))}
                    </View>
                </View>
                <View style={[styles.swipeHints, { marginTop: 20 }]}>
                    <SkeletonBox style={{ width: 220, height: 10, borderRadius: 5 }} />
                </View>
            </View>
        </View>
    );
};

const QuizItem = React.memo(({ quiz, index, isVisible, isCurrent, selection, onOptionPress, videoRefs }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [isVisible, fadeAnim]);

    if (!isVisible) {
        return <SkeletonCard />;
    }

    return (
        <Animated.View style={[styles.page, { opacity: fadeAnim }]}>
            <PagerView style={styles.horizontalPager} initialPage={0} orientation="horizontal">
                {/* Page 0: Question Content */}
                <View key="question" style={styles.questionPage}>
                    <View style={styles.quizScrollContent}>
                        <View style={styles.questionCard}>
                            {quiz.department && (
                                <Text style={styles.departmentLabel}>{quiz.department}</Text>
                            )}

                            <Text style={styles.complainText}>{quiz.complain}</Text>

                            {quiz.clinicalImages && quiz.clinicalImages.length > 0 && (
                                <View style={styles.imageCarouselContainer}>
                                    <ScrollView
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.imageCarousel}
                                        contentContainerStyle={styles.imageCarouselContent}
                                    >
                                        {quiz.clinicalImages.map((mediaUrl, imgIdx) => {
                                            const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(mediaUrl);

                                            if (isVideo) {
                                                const videoKey = `${index}-${imgIdx}`;
                                                const isPaused = !isCurrent;

                                                return (
                                                    <Video
                                                        key={imgIdx}
                                                        ref={(ref) => {
                                                            if (ref) {
                                                                videoRefs.current[videoKey] = ref;
                                                            }
                                                        }}
                                                        source={{ uri: mediaUrl }}
                                                        style={styles.quizImage}
                                                        resizeMode="cover"
                                                        repeat={true}
                                                        muted={true}
                                                        paused={isPaused}
                                                        poster={mediaUrl}
                                                        posterResizeMode="cover"
                                                        shutterColor="transparent"
                                                    />
                                                );
                                            }
                                            return (
                                                <Image
                                                    key={imgIdx}
                                                    source={{ uri: mediaUrl }}
                                                    style={styles.quizImage}
                                                />
                                            );
                                        })}
                                    </ScrollView>
                                    {quiz.clinicalImages.length > 1 && (
                                        <Text style={styles.imageCountText}>
                                            Swipe to see {quiz.clinicalImages.length} media
                                        </Text>
                                    )}
                                </View>
                            )}

                            <View style={styles.optionsContainer}>
                                {quiz.options.map((option, optIdx) => {
                                    const isCorrect = optIdx === quiz.correctOptionIndex;
                                    const isSelected = selection === optIdx;
                                    const showResult = selection !== undefined;

                                    let backgroundColor = '#fff';
                                    let borderColor = 'rgba(0,0,0,0.1)';
                                    let textColor = '#333';

                                    if (showResult) {
                                        if (isCorrect) {
                                            backgroundColor = '#E8F5E9';
                                            borderColor = '#4CAF50';
                                            textColor = '#2E7D32';
                                        } else if (isSelected) {
                                            backgroundColor = '#FFEBEE';
                                            borderColor = '#F44336';
                                            textColor = '#C62828';
                                        }
                                    }

                                    const optionLabels = ['A', 'B', 'C', 'D'];

                                    return (
                                        <TouchableOpacity
                                            key={optIdx}
                                            style={[styles.optionButton, { backgroundColor, borderColor }]}
                                            onPress={() => onOptionPress(quiz._id, optIdx)}
                                            disabled={showResult}
                                        >
                                            <View style={[
                                                styles.optionLabel,
                                                showResult && isCorrect && styles.optionLabelCorrect,
                                                showResult && isSelected && !isCorrect && styles.optionLabelWrong,
                                            ]}>
                                                <Text style={[
                                                    styles.optionLabelText,
                                                    showResult && (isCorrect || isSelected) && styles.optionLabelTextActive,
                                                ]}>{optionLabels[optIdx]}</Text>
                                            </View>
                                            <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                                            {showResult && isCorrect && (
                                                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                                            )}
                                            {showResult && isSelected && !isCorrect && (
                                                <MaterialCommunityIcons name="close-circle" size={20} color="#F44336" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                        </View>
                        <View style={styles.swipeHints}>
                            <Text style={styles.swipeHintText}>
                                Swipe up/down for next • Swipe right for explanation
                            </Text>
                        </View>
                    </View>
                </View>

                <View key="explanation" style={styles.explanationPage}>
                    <ScrollView
                        style={styles.explanationScrollView}
                        contentContainerStyle={styles.explanationScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {typeof quiz.explain === 'object' && quiz.explain !== null ? (
                            <>
                                <View style={styles.keyFeaturesCard}>
                                    {quiz.explain.correct_answer && (
                                        <View style={styles.correctAnswerRow}>
                                            <View style={styles.correctAnswerIcon}>
                                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                            </View>
                                            <Text style={styles.correctAnswerChoice}>
                                                {quiz.explain.correct_answer.choice}
                                            </Text>
                                        </View>
                                    )}

                                    {quiz.explain.key_features && (
                                        <>
                                            <Text style={styles.keyFeaturesTitle}>KEY FEATURES</Text>
                                            {quiz.explain.key_features.points?.map((point, pIdx) => (
                                                <View key={pIdx} style={styles.keyFeaturePoint}>
                                                    <View style={styles.keyFeatureBullet}>
                                                        <MaterialCommunityIcons name="star-four-points" size={14} color={Colors.brand.darkPink} />
                                                    </View>
                                                    <Text style={styles.keyFeatureText}>
                                                        <Text style={styles.keyFeatureLabel}>{point.label}: </Text>
                                                        <Text style={styles.keyFeatureDescription}>{point.description}</Text>
                                                    </Text>
                                                </View>
                                            ))}
                                        </>
                                    )}
                                </View>

                                {quiz?.explain?.incorrect_options?.length > 0 && (
                                    <View style={styles.incorrectOptionsCard}>
                                        <Text style={styles.incorrectOptionsTitle}>WHY OTHER OPTIONS ARE WRONG</Text>
                                        {quiz.explain.incorrect_options.map((option, iOptIdx) => (
                                            <View key={iOptIdx} style={styles.incorrectOption}>
                                                <View style={styles.incorrectOptionRow}>
                                                    <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" />
                                                    <Text style={styles.incorrectOptionText}>
                                                        <Text style={styles.incorrectOptionChoice}>{option.choice}: </Text>
                                                        <Text style={styles.incorrectOptionExplanation}>{option.explanation}</Text>
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.explanationCard}>
                                <Text style={styles.explanationTitle}>Explanation</Text>
                                <Text style={styles.explanationText}>
                                    {typeof quiz.explain === 'string' ? quiz.explain : 'No explanation available.'}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </PagerView>
        </Animated.View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
        prevProps.isVisible === nextProps.isVisible &&
        prevProps.isCurrent === nextProps.isCurrent &&
        prevProps.selection === nextProps.selection &&
        prevProps.quiz._id === nextProps.quiz._id
    );
});

export default function QuizzPlay({ route, navigation }) {
    const {
        categoryId,
        categoryName,
        initialAttemptedCount = 0,
        totalQuizzCount = 0
    } = route.params || {};
    const dispatch = useDispatch();
    const quizzesStatus = useSelector(selectQuizzStatus);
    const quizzesError = useSelector(selectQuizzError);
    const quizzes = useSelector((state) => state.quizz.quizzes);
    const hasMore = useSelector(selectQuizzHasMore);
    const isFetchingMore = useSelector(selectQuizzIsFetchingMore);
    const userData = useSelector((state) => state.user.userData);
    const userId = userData?._id;

    const [selections, setSelections] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const pagerRef = useRef(null);
    const videoRefs = useRef({});

    const CONTENT_WINDOW = 2;

    useEffect(() => {
        dispatch(fetchQuizzesByCategory({
            categoryId: categoryId || null,
            userId,
            excludeAttempted: true
        }));
        return () => {
            dispatch(resetQuizState());
        };
    }, [dispatch, categoryId, userId]);

    const handlePageSelected = useCallback((e) => {
        const position = e.nativeEvent.position;
        setCurrentQuestionIndex(position);

        const threshold = quizzes.length - 4;
        if (hasMore && !isFetchingMore && position >= threshold && threshold >= 0) {
            dispatch(fetchMoreQuizzes(userId));
        }
    }, [dispatch, hasMore, isFetchingMore, quizzes.length, userId]);

    const handleBack = () => navigation.goBack();

    const onOptionPress = useCallback((quizId, index) => {
        setSelections(prev => {
            if (prev[quizId] !== undefined) return prev;

            const quiz = quizzes.find(q => q._id === quizId);
            if (quiz && userId) {
                dispatch(submitQuizzAttempt({
                    userId,
                    quizzId: quizId,
                    selectedOption: index,
                    isCorrect: index === quiz.correctOptionIndex
                }));
            }

            return { ...prev, [quizId]: index };
        });
    }, [quizzes, userId, dispatch]);

    // Pre-fetching for smoother images
    useEffect(() => {
        const nextIndices = [currentQuestionIndex + 1, currentQuestionIndex + 2];
        nextIndices.forEach(idx => {
            if (quizzes[idx]?.clinicalImages) {
                quizzes[idx].clinicalImages.forEach(url => {
                    const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(url);
                    if (!isVideo) Image.prefetch(url);
                });
            }
        });
    }, [currentQuestionIndex, quizzes]);

    if (quizzesStatus === 'failed') {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={handleBack} style={styles.floatingBackButton}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#F44336" />
                    <Text style={styles.errorText}>{quizzesError || 'Failed to load quizzes.'}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => dispatch(fetchQuizzesByCategory(categoryId || null))}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (quizzesStatus === 'loading' && quizzes.length === 0) {
        return (
            <View style={{ flex: 1 }}>
                <LinearGradient colors={SUBTLE_PINK_GRADIENT} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={styles.container}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.floatingBackButton}>
                            <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <SkeletonCard />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient colors={SUBTLE_PINK_GRADIENT} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleBack} style={styles.floatingBackButton}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                    </TouchableOpacity>
                    {quizzes.length > 0 && (
                        <View style={styles.questionCounter}>
                            <Text style={styles.questionCounterText}>
                                {totalQuizzCount > 0
                                    ? `${initialAttemptedCount + currentQuestionIndex + 1}/${totalQuizzCount}`
                                    : `${currentQuestionIndex + 1}/${quizzes.length}`
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {quizzes.length === 0 ? (
                    <View style={[styles.centered, { marginTop: 100 }]}>
                        <MaterialCommunityIcons name="comment-question-outline" size={64} color="#ddd" />
                        <Text style={styles.emptyText}>No quizzes found.</Text>
                    </View>
                ) : (
                    <PagerView
                        ref={pagerRef}
                        style={styles.pagerView}
                        initialPage={0}
                        orientation="vertical"
                        onPageSelected={handlePageSelected}
                        offscreenPageLimit={1}
                    >
                        {quizzes.map((quiz, qIdx) => {
                            const isVisible = Math.abs(qIdx - currentQuestionIndex) <= CONTENT_WINDOW;
                            const isCurrent = qIdx === currentQuestionIndex;
                            return (
                                <View key={quiz._id || qIdx.toString()} style={{ flex: 1 }}>
                                    <QuizItem
                                        quiz={quiz}
                                        index={qIdx}
                                        isVisible={isVisible}
                                        isCurrent={isCurrent}
                                        selection={selections[quiz._id]}
                                        onOptionPress={onOptionPress}
                                        videoRefs={videoRefs}
                                    />
                                </View>
                            );
                        })}
                    </PagerView>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    floatingBackButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    questionCounter: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    questionCounterText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.brand.darkPink,
    },
    backButton: {
        padding: 4,
    },
    headerTitleSmall: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
        marginLeft: 4,
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    pagerView: {
        flex: 1,
    },
    horizontalPager: {
        flex: 1,
    },
    page: {
        flex: 1,
        // backgroundColor: "#eec0d1ff",
    },
    questionPage: {
        flex: 1,
    },
    explanationPage: {
        flex: 1,
    },
    quizScrollContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    departmentLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.brand.darkPink,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    explanationScrollContent: {
        paddingTop: 80,
        paddingBottom: 40,
        flexGrow: 1,
        justifyContent: 'center',
    },
    swipeHints: {
        alignItems: 'center',
        marginTop: 16,
    },
    swipeHintText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
        textAlign: 'center',
    },
    swipeBackHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 8,
        opacity: 0.5,
    },
    swipeBackText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    imageCarouselContainer: {
        marginVertical: 12,
    },
    imageCarousel: {
        width: screenWidth - 64,
    },
    imageCarouselContent: {
        alignItems: 'center',
    },
    quizImage: {
        width: screenWidth - 64,
        height: 280,
        borderRadius: 12,
        backgroundColor: '#000',
        resizeMode: 'contain',
    },
    imageCountText: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        marginTop: 6,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    skeletonQuestionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    skeletonOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        minHeight: 56,
        gap: 12,
    },
    complainText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        fontWeight: '600',
    },
    optionsContainer: {
        gap: 10,
        marginTop: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 56,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 2,
    },
    optionLabel: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabelCorrect: {
        backgroundColor: '#4CAF50',
    },
    optionLabelWrong: {
        backgroundColor: '#F44336',
    },
    optionLabelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
    },
    optionLabelTextActive: {
        color: '#fff',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    explanationScrollView: {
        flex: 1,
    },
    explanationScrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    // Correct Answer Row (inside key features card)
    correctAnswerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    correctAnswerIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctAnswerChoice: {
        flex: 1,
        flexShrink: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46',
        lineHeight: 20,
    },
    // Key Features Section
    keyFeaturesCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    keyFeaturesTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.brand.darkPink,
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    keyFeaturePoint: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    keyFeatureBullet: {
        marginRight: 10,
        marginTop: 4,
    },
    keyFeatureText: {
        flex: 1,
        flexShrink: 1,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    keyFeatureLabel: {
        fontWeight: '700',
        color: '#333',
    },
    keyFeatureDescription: {
        fontWeight: '400',
    },
    // Incorrect Options Section
    incorrectOptionsCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    incorrectOptionsTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#DC2626',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    incorrectOption: {
        marginBottom: 10,
    },
    incorrectOptionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    incorrectOptionText: {
        flex: 1,
        flexShrink: 1,
        fontSize: 13,
        color: '#7F1D1D',
        lineHeight: 19,
    },
    incorrectOptionChoice: {
        fontWeight: '700',
        color: '#B91C1C',
    },
    incorrectOptionExplanation: {
        fontWeight: '400',
    },
    // Fallback explanation card
    explanationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.brand.darkPink,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    explanationTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.brand.darkPink,
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginBottom: 20,
    },
    nextButton: {
        backgroundColor: Colors.brand.darkPink,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: Colors.brand.darkPink,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
});
