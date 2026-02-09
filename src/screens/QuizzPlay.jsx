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
    Pressable,
    Linking,
    Platform,
    Alert,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import Purchases from 'react-native-purchases';
import { useDispatch, useSelector } from 'react-redux';
import premiumImage from '../../constants/premium-image.png';
import { updateUser, setCustomerInfo } from '../store/slices/userSlice';
import { API_BASE } from '../../constants/Api';
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
                                <View style={styles.departmentRow}>
                                    <Text style={styles.departmentLabel}>{quiz.department}</Text>
                                </View>
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

const PremiumLimitCard = ({ onBack }) => {
    const dispatch = useDispatch();
    const { userData } = useSelector(state => state.user);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [offerings, setOfferings] = useState(null);
    const [entitlements, setEntitlements] = useState(null);
    const [loading, setLoading] = useState(false);

    const getOfferingsAndEntitlements = useCallback(async () => {
        try {
            setLoading(true);
            const o = await Purchases.getOfferings();
            if (o?.current?.availablePackages?.length > 0) {
                setOfferings(o);
                if (o.current.lifetime) setSelectedPlan('lifetime');
                else if (o.current.sixMonth) setSelectedPlan('sixMonth');
                else if (o.current.monthly) setSelectedPlan('monthly');
                else if (o.current.weekly) setSelectedPlan('weekly');
            }
            const customerInfo = await Purchases.getCustomerInfo();
            setEntitlements(customerInfo.entitlements.active);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getOfferingsAndEntitlements();
    }, [getOfferingsAndEntitlements]);

    const handlePurchase = async (pkg) => {
        try {
            setLoading(true);
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            dispatch(setCustomerInfo(customerInfo));
            // Sync with server
            const active = customerInfo?.entitlements?.active || {};
            const hasActive = Object.keys(active).length > 0;
            const uid = userData?.userId || userData?._id || userData?.id;
            if (uid) {
                await dispatch(updateUser({
                    userId: uid,
                    userData: { isPremium: hasActive }
                }));
            }
        } catch (e) {
            if (!e?.userCancelled) {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    const sixMonthPackage = offerings?.current?.sixMonth || null;
    const monthlyPackage = offerings?.current?.monthly || null;
    const weeklyPackage = offerings?.current?.weekly || null;
    const lifetimePackage = offerings?.current?.lifetime || null;
    const selectedPackage = selectedPlan === 'monthly' ? monthlyPackage : selectedPlan === 'sixMonth' ? sixMonthPackage : selectedPlan === 'weekly' ? weeklyPackage : selectedPlan === 'lifetime' ? lifetimePackage : null;

    const roundPriceForDisplay = (price) => {
        if (price < 100) return Math.floor(price) + 0.99;
        return Math.ceil(price);
    };

    const formatCurrencyPrice = (price, currencyCode, shouldRound = false) => {
        try {
            if (!price || !currencyCode) return '';
            const finalPrice = shouldRound ? roundPriceForDisplay(price) : price;
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(finalPrice);
        } catch {
            const finalPrice = shouldRound ? roundPriceForDisplay(price) : price;
            return `${currencyCode} ${finalPrice.toFixed(2)}`;
        }
    };

    const getMonthlyStrikethroughPrice = () => {
        if (!monthlyPackage?.product?.price || !monthlyPackage?.product?.currencyCode) return null;
        return formatCurrencyPrice(monthlyPackage.product.price * 2.0, monthlyPackage.product.currencyCode, true);
    };

    const getSixMonthStrikethroughPrice = () => {
        if (!sixMonthPackage?.product?.price || !sixMonthPackage?.product?.currencyCode) return null;
        return formatCurrencyPrice(sixMonthPackage.product.price * 2.0, sixMonthPackage.product.currencyCode, true);
    };

    const getWeeklyStrikethroughPrice = () => {
        if (!weeklyPackage?.product?.price || !weeklyPackage?.product?.currencyCode) return null;
        return formatCurrencyPrice(weeklyPackage.product.price * 2.0, weeklyPackage.product.currencyCode, true);
    };

    const getLifetimeStrikethroughPrice = () => {
        if (!lifetimePackage?.product?.price || !lifetimePackage?.product?.currencyCode) return null;
        return formatCurrencyPrice(lifetimePackage.product.price * 2.0, lifetimePackage.product.currencyCode, true);
    };

    return (
        <View style={[styles.page, { backgroundColor: '#fff' }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={premiumImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', bottom: 12, width: '100%', alignItems: 'center', paddingHorizontal: 16 }}>
                        <View
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                borderRadius: 16,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 2,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.brand.darkPink }}>Premium Limit Reached</Text>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A4A4A', marginTop: 4, textAlign: 'center' }}>
                                Free users can play up to 10 cases. Subscribe to continue!
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color={Colors.brand.darkPink} style={{ marginTop: 2 }} />
                        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 }}>Unlimited Hearts for Clinical Cases</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color={Colors.brand.darkPink} style={{ marginTop: 2 }} />
                        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 }}>Unlock Detailed Clinical Insights</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color={Colors.brand.darkPink} style={{ marginTop: 2 }} />
                        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 }}>Play past daily cases</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color={Colors.brand.darkPink} style={{ marginTop: 2 }} />
                        <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 }}>Unlimited access to all quizzes</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                    {weeklyPackage && (
                        <Pressable
                            onPress={() => setSelectedPlan('weekly')}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: selectedPlan === 'weekly' ? Colors.brand.darkPink : '#EDEDED',
                                padding: 14,
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name={selectedPlan === 'weekly' ? 'check-circle' : 'circle-outline'}
                                    size={22}
                                    color={selectedPlan === 'weekly' ? Colors.brand.darkPink : '#B0B7BF'}
                                />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Weekly Plan</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                                        {'Try it for a week. Auto-renewal subscription'}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                                        {weeklyPackage?.product?.priceString || ''}
                                    </Text>
                                    {getWeeklyStrikethroughPrice() && (
                                        <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                                            {getWeeklyStrikethroughPrice()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    )}

                    {lifetimePackage && (
                        <Pressable
                            onPress={() => setSelectedPlan('lifetime')}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: selectedPlan === 'lifetime' ? Colors.brand.darkPink : '#EDEDED',
                                padding: 14,
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ position: 'absolute', top: -10, right: 14, zIndex: 1 }}>
                                <View style={{ backgroundColor: '#FFD700', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#000000', fontWeight: '900', fontSize: 10 }}>ONE TIME ONLY</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name={selectedPlan === 'lifetime' ? 'check-circle' : 'circle-outline'}
                                    size={22}
                                    color={selectedPlan === 'lifetime' ? Colors.brand.darkPink : '#B0B7BF'}
                                />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Lifetime Pass</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                                        {'Pay once, own it forever. Best for serious learners'}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                                        {lifetimePackage?.product?.priceString || ''}
                                    </Text>
                                    {getLifetimeStrikethroughPrice() && (
                                        <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                                            {getLifetimeStrikethroughPrice()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    )}

                    {monthlyPackage && (
                        <Pressable
                            onPress={() => setSelectedPlan('monthly')}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: selectedPlan === 'monthly' ? Colors.brand.darkPink : '#EDEDED',
                                padding: 14,
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name={selectedPlan === 'monthly' ? 'check-circle' : 'circle-outline'}
                                    size={22}
                                    color={selectedPlan === 'monthly' ? Colors.brand.darkPink : '#B0B7BF'}
                                />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>Monthly Plan</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                                        {'Short term plan. Auto-renewal subscription'}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                                        {monthlyPackage?.product?.priceString || ''}
                                    </Text>
                                    {getMonthlyStrikethroughPrice() && (
                                        <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                                            {getMonthlyStrikethroughPrice()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    )}

                    {sixMonthPackage && (
                        <Pressable
                            onPress={() => setSelectedPlan('sixMonth')}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                borderWidth: 2,
                                borderColor: selectedPlan === 'sixMonth' ? Colors.brand.darkPink : '#EDEDED',
                                padding: 14,
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ position: 'absolute', top: -10, right: 14, zIndex: 1 }}>
                                <View style={{ backgroundColor: '#4CAF50', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 10 }}>BEST VALUE</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name={selectedPlan === 'sixMonth' ? 'check-circle' : 'circle-outline'}
                                    size={22}
                                    color={selectedPlan === 'sixMonth' ? Colors.brand.darkPink : '#B0B7BF'}
                                />
                                <View style={{ marginLeft: 10, flex: 1, paddingRight: 10 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>6 Month Plan</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#65727E', marginTop: 2 }}>
                                        {'Value for money. Auto-renewal subscription'}
                                    </Text>
                                    {sixMonthPackage?.product?.pricePerMonthString && (
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#4CAF50', marginTop: 2 }}>
                                            Only {sixMonthPackage.product.pricePerMonthString}/month
                                        </Text>
                                    )}
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1E1E' }}>
                                        {sixMonthPackage?.product?.priceString || ''}
                                    </Text>
                                    {getSixMonthStrikethroughPrice() && (
                                        <Text style={{ fontSize: 12, color: '#9AA3AB', textDecorationLine: 'line-through' }}>
                                            {getSixMonthStrikethroughPrice()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    )}
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => selectedPackage && handlePurchase(selectedPackage)}
                        style={{
                            backgroundColor: Colors.brand.darkPink,
                            borderRadius: 16,
                            paddingVertical: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: selectedPackage ? 1 : 0.6,
                        }}
                        disabled={!selectedPackage || loading}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginRight: 6 }}>
                                {loading ? 'Processing...' : 'Subscribe Now'}
                            </Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                    <Text style={{ textAlign: 'center', color: '#4A5564', fontWeight: '700' }}>Cancel anytime</Text>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                    <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                        By continuing, you agree to our{' '}
                        <Text
                            style={{ color: Colors.brand.darkPink, fontWeight: '800', textDecorationLine: 'underline' }}
                            onPress={() => Linking.openURL('https://www.diagnoseit.in/terms')}
                        >
                            terms of use
                        </Text>{' '}
                        &{' '}
                        <Text
                            style={{ color: Colors.brand.darkPink, fontWeight: '800', textDecorationLine: 'underline' }}
                            onPress={() => Linking.openURL('https://www.diagnoseit.in/privacy')}
                        >
                            privacy policy
                        </Text>
                        .
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};


export default function QuizzPlay({ route, navigation }) {
    const {
        categoryId,
        categoryName,
        initialAttemptedCount = 0,
        globalAttemptedCount = 0,
        totalQuizzCount = 0
    } = route.params || {};

    const dispatch = useDispatch(); // Still needed for userSlice (premium purchases)
    const userData = useSelector((state) => state.user.userData);
    const userId = userData?._id;

    // Local state instead of Redux
    const [quizzes, setQuizzes] = useState([]);
    const [quizzesStatus, setQuizzesStatus] = useState('idle');
    const [quizzesError, setQuizzesError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Two-array approach for solved quizzes (avoids index shifting on pagination)
    const [olderSolvedQuizzes, setOlderSolvedQuizzes] = useState([]);  // Older solved quizzes (appended)
    const [recentSolvedQuizzes, setRecentSolvedQuizzes] = useState([]); // Recent solved quizzes (initial load)
    const [solvedStatus, setSolvedStatus] = useState('idle');
    const [solvedHasMore, setSolvedHasMore] = useState(false);
    const [solvedTotal, setSolvedTotal] = useState(0);
    const [isFetchingMoreSolved, setIsFetchingMoreSolved] = useState(false);

    // Refs to track pagination state
    const pageRef = useRef(1);
    const solvedPageRef = useRef(1);
    const selectedCategoryIdRef = useRef(categoryId);

    // Combined solved quizzes for display (older first, then recent)
    const solvedQuizzes = useMemo(() => {
        return [...olderSolvedQuizzes, ...recentSolvedQuizzes];
    }, [olderSolvedQuizzes, recentSolvedQuizzes]);

    const [selections, setSelections] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showSolved, setShowSolved] = useState(false);
    const [showSolvedButton, setShowSolvedButton] = useState(false);
    const pagerRef = useRef(null);
    const videoRefs = useRef({});
    const solvedButtonAnim = useRef(new Animated.Value(-150)).current;
    const isDraggingAtFirstPage = useRef(false);

    const CONTENT_WINDOW = 2;

    // API: Fetch quizzes by category (initial load)
    const fetchQuizzesByCategoryApi = useCallback(async () => {
        setQuizzesStatus('loading');
        setQuizzesError(null);
        pageRef.current = 1;
        selectedCategoryIdRef.current = categoryId;

        try {
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=1&limit=10`
                : `${API_BASE}/api/quizz?page=1&limit=10`;

            if (userId) url += `&userId=${userId}`;
            url += `&excludeAttempted=true`;

            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load quizzes (${res.status})`);
            }
            const data = await res.json();
            setQuizzes(data.data || []);
            setHasMore(data.hasMore || false);
            setQuizzesStatus('succeeded');
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setQuizzesError(error.message);
            setQuizzesStatus('failed');
        }
    }, [categoryId, userId]);

    // API: Fetch more quizzes (pagination)
    const fetchMoreQuizzesApi = useCallback(async () => {
        if (!hasMore || isFetchingMore) return;

        setIsFetchingMore(true);
        const nextPage = pageRef.current + 1;

        try {
            let url = selectedCategoryIdRef.current
                ? `${API_BASE}/api/quizz?category=${selectedCategoryIdRef.current}&page=${nextPage}&limit=10`
                : `${API_BASE}/api/quizz?page=${nextPage}&limit=10`;

            if (userId) url += `&userId=${userId}`;
            url += `&excludeAttempted=true`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to load more quizzes');
            }
            const data = await res.json();
            setQuizzes(prev => [...prev, ...(data.data || [])]);
            setHasMore(data.hasMore || false);
            pageRef.current = nextPage;
        } catch (error) {
            console.error('Error fetching more quizzes:', error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [hasMore, isFetchingMore, userId]);

    // API: Fetch solved quizzes (initial load - these become "recent" solved quizzes)
    const fetchSolvedQuizzesApi = useCallback(async () => {
        setSolvedStatus('loading');
        solvedPageRef.current = 1;
        setOlderSolvedQuizzes([]);  // Reset older quizzes

        try {
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=1&limit=10&onlyAttempted=true`
                : `${API_BASE}/api/quizz?page=1&limit=10&onlyAttempted=true`;

            if (userId) url += `&userId=${userId}`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to load solved quizzes');
            }
            const data = await res.json();
            // Reverse to show in chronological order
            const reversedQuizzes = [...(data.data || [])].reverse();
            setRecentSolvedQuizzes(reversedQuizzes);
            setSolvedHasMore(data.hasMore || false);
            setSolvedTotal(data.total || 0);
            setSolvedStatus('succeeded');
        } catch (error) {
            console.error('Error fetching solved quizzes:', error);
            setSolvedStatus('failed');
        }
    }, [categoryId, userId]);

    // API: Fetch more solved quizzes (pagination - APPEND to olderSolvedQuizzes)
    const fetchMoreSolvedQuizzesApi = useCallback(async () => {
        if (!solvedHasMore || isFetchingMoreSolved) return;

        setIsFetchingMoreSolved(true);
        const nextPage = solvedPageRef.current + 1;

        try {
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=${nextPage}&limit=10&onlyAttempted=true`
                : `${API_BASE}/api/quizz?page=${nextPage}&limit=10&onlyAttempted=true`;

            if (userId) url += `&userId=${userId}`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to load more solved quizzes');
            }
            const data = await res.json();
            // Reverse and APPEND to olderSolvedQuizzes (no index shift needed!)
            const reversedQuizzes = [...(data.data || [])].reverse();
            setOlderSolvedQuizzes(prev => {
                const existingIds = new Set([...prev, ...recentSolvedQuizzes].map(q => q._id));
                const newQuizzes = reversedQuizzes.filter(q => !existingIds.has(q._id));
                return [...newQuizzes, ...prev];  // Prepend to older array (these are chronologically earlier)
            });
            setSolvedHasMore(data.hasMore || false);
            solvedPageRef.current = nextPage;
        } catch (error) {
            console.error('Error fetching more solved quizzes:', error);
        } finally {
            setIsFetchingMoreSolved(false);
        }
    }, [categoryId, userId, solvedHasMore, isFetchingMoreSolved, recentSolvedQuizzes]);

    // API: Submit quiz attempt (fire-and-forget)
    const submitQuizzAttemptApi = useCallback(async (quizzId, selectedOption, isCorrect) => {
        try {
            await fetch(`${API_BASE}/api/quizz/attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, quizzId, selectedOption, isCorrect }),
            });
        } catch (error) {
            console.error('Error submitting attempt:', error);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        fetchQuizzesByCategoryApi();
    }, [fetchQuizzesByCategoryApi]);

    // Populate selections from backend attempt data (for both solved and unsolved)
    useEffect(() => {
        const allQuizzes = [...quizzes, ...solvedQuizzes];
        if (allQuizzes.length > 0) {
            const initialSelections = {};
            allQuizzes.forEach(q => {
                if (q.attempt) {
                    initialSelections[q._id] = q.attempt.selectedOption;
                }
            });
            setSelections(prev => ({ ...prev, ...initialSelections }));
        }
    }, [quizzes, solvedQuizzes]);

    // Construct the display list
    const displayList = useMemo(() => {
        if (quizzesStatus !== 'succeeded') return [];

        let list = [];
        const isPremium = userData?.isPremium;

        if (!isPremium) {
            // Calculate how many NEW quizzes they can still play
            // globalAttemptedCount is passed from QuizzScreen as total quizzes attempted by user across all categories
            const maxNewCases = Math.max(0, 10 - globalAttemptedCount);
            const allowedUnsolved = quizzes.slice(0, maxNewCases);

            if (showSolved) {
                list = [...solvedQuizzes, ...allowedUnsolved];
            } else {
                list = [...allowedUnsolved];
            }

            // If there are more quizzes than allowed, show the limit card
            if (quizzes.length > maxNewCases) {
                list.push({ _id: 'limit-reached', isLimit: true });
            }
        } else {
            // Premium users get everything
            if (showSolved) {
                list = [...solvedQuizzes, ...quizzes];
            } else {
                list = [...quizzes];
            }
        }

        return list;
    }, [quizzesStatus, showSolved, solvedQuizzes, quizzes, userData?.isPremium, globalAttemptedCount]);

    // Handle initial landing - always start at index 0 (first unsolved quiz)
    const [initialLandDone, setInitialLandDone] = useState(false);
    useEffect(() => {
        if (quizzesStatus === 'succeeded' && !initialLandDone && displayList.length > 0) {
            setCurrentQuestionIndex(0);
            setInitialLandDone(true);
        }
    }, [quizzesStatus, initialLandDone, displayList]);

    const handlePageSelected = useCallback((e) => {
        const position = e.nativeEvent.position;
        setCurrentQuestionIndex(position);

        // Hide the solved button when user moves away from first page
        if (position !== 0 && showSolvedButton) {
            setShowSolvedButton(false);
            Animated.timing(solvedButtonAnim, {
                toValue: -150,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }

        // Pagination for unsolved quizzes (when near the end)
        if (showSolved) {
            // In showSolved mode, unsolved quizzes start after solvedQuizzes
            const unsolvedStartIndex = solvedQuizzes.length;
            const unsolvedPosition = position - unsolvedStartIndex;
            const threshold = quizzes.length - 4;
            if (hasMore && !isFetchingMore && unsolvedPosition >= threshold && threshold >= 0) {
                fetchMoreQuizzesApi();
            }
        } else {
            const threshold = quizzes.length - 4;
            if (hasMore && !isFetchingMore && position >= threshold && threshold >= 0) {
                fetchMoreQuizzesApi();
            }
        }

        // Pagination for solved quizzes (when near the beginning)
        // When user is viewing solved quizzes and gets close to the oldest one (index 5 or less)
        if (showSolved && position < solvedQuizzes.length && position <= 4 && solvedHasMore && !isFetchingMoreSolved) {
            fetchMoreSolvedQuizzesApi();
        }
    }, [hasMore, isFetchingMore, quizzes.length, showSolvedButton, solvedButtonAnim, showSolved, solvedQuizzes.length, solvedHasMore, isFetchingMoreSolved, fetchMoreQuizzesApi, fetchMoreSolvedQuizzesApi]);

    // Track scroll state to detect overscroll attempt at page 0
    const handlePageScrollStateChanged = useCallback((e) => {
        const state = e.nativeEvent.pageScrollState;

        if (state === 'dragging') {
            // User started dragging - check if at first page and there are solved quizzes
            // Use initialAttemptedCount from route params since solved quizzes aren't loaded yet
            if (currentQuestionIndex === 0 && !showSolved && initialAttemptedCount > 0) {
                isDraggingAtFirstPage.current = true;
            }
        } else if (state === 'idle') {
            // User stopped dragging - if they were at first page and still at first page, show button
            if (isDraggingAtFirstPage.current && currentQuestionIndex === 0 && !showSolvedButton) {
                setShowSolvedButton(true);
                Animated.spring(solvedButtonAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            }
            isDraggingAtFirstPage.current = false;
        }
    }, [currentQuestionIndex, showSolved, initialAttemptedCount, showSolvedButton, solvedButtonAnim]);

    const handleBack = () => navigation.goBack();

    const handleShowSolved = useCallback(() => {
        // Fetch solved quizzes - button will show "Loading..." while fetching
        fetchSolvedQuizzesApi();
        // Don't set showSolved yet - wait for data to load
        // Button stays visible with loading state
    }, [fetchSolvedQuizzesApi]);

    // When solved quizzes are loaded, update the display and adjust page index

    useEffect(() => {
        if (solvedStatus === 'succeeded' && solvedQuizzes.length > 0 && !showSolved) {
            // Data loaded! Calculate the new index FIRST
            // The unsolved cases will start at index solvedQuizzes.length
            const newIndex = solvedQuizzes.length;

            // Set the index immediately to prevent flicker
            setCurrentQuestionIndex(newIndex);

            // Hide button and show solved cases
            setShowSolvedButton(false);
            solvedButtonAnim.setValue(-150);

            // Adjust the native pager position without animation to stay on the same quiz
            if (pagerRef.current) {
                pagerRef.current.setPageWithoutAnimation(newIndex);
            }
            setShowSolved(true);
        }
    }, [solvedStatus, solvedQuizzes.length, showSolved, solvedButtonAnim]);

    // NOTE: With two-array approach, index adjustment is only needed when olderSolvedQuizzes grows.
    // But since recentSolvedQuizzes doesn't change after initial load, the user's position relative
    // to recentSolvedQuizzes items stays the same. Only need to add olderSolvedQuizzes.length offset.
    const prevOlderLengthRef = useRef(0);
    useEffect(() => {
        const currentOlderLength = olderSolvedQuizzes.length;
        const previousOlderLength = prevOlderLengthRef.current;

        if (showSolved && currentOlderLength > previousOlderLength && previousOlderLength >= 0) {
            const addedCount = currentOlderLength - previousOlderLength;

            setCurrentQuestionIndex(prevIndex => {
                const newIndex = prevIndex + addedCount;
                if (pagerRef.current) {
                    pagerRef.current.setPageWithoutAnimation(newIndex);
                }
                return newIndex;
            });
        }

        prevOlderLengthRef.current = currentOlderLength;
    }, [olderSolvedQuizzes.length, showSolved]);

    const onOptionPress = useCallback((quizId, index) => {
        setSelections(prev => {
            if (prev[quizId] !== undefined) return prev;

            const quiz = quizzes.find(q => q._id === quizId);
            if (quiz && userId) {
                submitQuizzAttemptApi(quizId, index, index === quiz.correctOptionIndex);
            }

            return { ...prev, [quizId]: index };
        });
    }, [quizzes, userId, submitQuizzAttemptApi]);

    // Pre-fetching for smoother images
    useEffect(() => {
        const nextIndices = [currentQuestionIndex + 1, currentQuestionIndex + 2];
        nextIndices.forEach(idx => {
            const item = displayList[idx];
            if (item && item.clinicalImages) {
                item.clinicalImages.forEach(url => {
                    const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(url);
                    if (!isVideo) Image.prefetch(url);
                });
            }
        });
    }, [currentQuestionIndex, displayList]);

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
                        onPress={fetchQuizzesByCategoryApi}
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
                            {(() => {
                                const totalLoaded = displayList.filter(i => !i.isLimit).length;
                                const hasPlus = hasMore;
                                const currentItem = displayList[currentQuestionIndex];

                                // Hide counter on limit card
                                if (currentItem?.isLimit) return null;

                                let content = '';
                                if (totalQuizzCount > 0) {
                                    if (showSolved) {
                                        // In showSolved mode: [solved..., unsolved...]
                                        const displaySolvedTotal = solvedTotal > 0 ? solvedTotal : initialAttemptedCount;
                                        const solvedStartIndex = displaySolvedTotal - solvedQuizzes.length;
                                        const currentAvailableTotal = solvedStartIndex + totalLoaded;

                                        if (currentQuestionIndex < solvedQuizzes.length) {
                                            // Viewing a solved quiz
                                            content = `${solvedStartIndex + currentQuestionIndex + 1}/${currentAvailableTotal}`;
                                        } else {
                                            // Viewing an unsolved quiz
                                            const unsolvedIndex = currentQuestionIndex - solvedQuizzes.length;
                                            content = `${displaySolvedTotal + unsolvedIndex + 1}/${currentAvailableTotal}`;
                                        }
                                    } else {
                                        // Not in showSolved mode
                                        const currentAvailableTotal = initialAttemptedCount + totalLoaded;
                                        content = `${initialAttemptedCount + currentQuestionIndex + 1}/${currentAvailableTotal}`;
                                    }
                                } else {
                                    content = `${currentQuestionIndex + 1}/${totalLoaded}`;
                                }

                                return (
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        <Text style={styles.questionCounterText}>{content}</Text>
                                        {hasPlus && (
                                            <Text style={[styles.questionCounterText, { fontSize: 10, lineHeight: 14, marginTop: -2 }]}>+</Text>
                                        )}
                                    </View>
                                );
                            })()}
                        </View>
                    )}
                </View>

                {/* Floating "View Solved Cases" button - animates in when user swipes down from first page */}
                {!showSolved && initialAttemptedCount > 0 && (
                    <Animated.View
                        pointerEvents="box-none"
                        style={[
                            styles.viewSolvedButtonContainer,
                            { transform: [{ translateY: solvedButtonAnim }] }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.viewSolvedButton}
                            onPress={handleShowSolved}
                            disabled={solvedStatus === 'loading'}
                        >
                            {solvedStatus === 'loading' ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.viewSolvedButtonText}>Loading...</Text>
                                </>
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="history" size={18} color="#fff" />
                                    <Text style={styles.viewSolvedButtonText}>View {initialAttemptedCount} Solved Cases</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {displayList.length === 0 ? (
                    <View style={[styles.centered, { marginTop: 100 }]}>
                        <MaterialCommunityIcons name="comment-question-outline" size={64} color="#ddd" />
                        <Text style={styles.emptyText}>No quizzes found.</Text>
                    </View>
                ) : (
                    <PagerView
                        ref={pagerRef}
                        style={styles.pagerView}
                        initialPage={currentQuestionIndex}
                        orientation="vertical"
                        onPageSelected={handlePageSelected}
                        onPageScrollStateChanged={handlePageScrollStateChanged}
                        offscreenPageLimit={1}
                    >
                        {displayList.map((item, idx) => {
                            // Always render solved quizzes fully (no skeleton) to avoid flicker during pagination
                            const isVisible = (showSolved && idx < solvedQuizzes.length)
                                ? true
                                : Math.abs(idx - currentQuestionIndex) <= CONTENT_WINDOW;
                            const isCurrent = idx === currentQuestionIndex;





                            return (
                                <View key={item._id || idx.toString()} style={{ flex: 1 }}>
                                    {item.isLimit ? (
                                        <PremiumLimitCard onBack={handleBack} />
                                    ) : (
                                        <QuizItem
                                            quiz={item}
                                            index={idx}
                                            isVisible={isVisible}
                                            isCurrent={isCurrent}
                                            selection={selections[item._id]}
                                            onOptionPress={onOptionPress}
                                            videoRefs={videoRefs}
                                        />
                                    )}
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
    viewSolvedButtonContainer: {
        position: 'absolute',
        top: 70, // Below header
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    viewSolvedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.darkPink,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    viewSolvedButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
    limitHeaderCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        alignItems: 'center',
    },
    limitHeaderTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.brand.darkPink,
    },
    limitHeaderSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A4A4A',
        marginTop: 6,
        textAlign: 'center',
    },
    limitPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    limitPointText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#f3f4f6',
        padding: 16,
        marginBottom: 12,
    },
    planCardSelected: {
        borderColor: Colors.brand.darkPink,
        backgroundColor: '#fdf2f8',
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    planPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 2,
    },
    subscribeButton: {
        backgroundColor: Colors.brand.darkPink,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brand.darkPink,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    subscribeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    explanationPage: {
        flex: 1,
    },
    quizScrollContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    departmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    departmentLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.brand.darkPink,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.brand.darkPink,
        borderRadius: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        fontWeight: '600',
        marginTop: 12,
    },
});
