import React, { useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchQuizzCategories,
    selectQuizzCategories,
    selectQuizzCategoriesStatus
} from '../store/slices/quizzSlice';
import { Colors } from '../../constants/Colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
                        <SkeletonBox style={{ width: '40%', height: 10 }} />
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function QuizzScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const categories = useSelector(selectQuizzCategories);
    const categoriesStatus = useSelector(selectQuizzCategoriesStatus);
    const userData = useSelector((state) => state.user.userData);
    const userId = userData?._id;

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchQuizzCategories(userId));
        }, [dispatch, userId])
    );

    const handleCategoryPress = (category) => {
        let initialAttemptedCount = 0;
        let totalQuizzCount = 0;

        if (category) {
            initialAttemptedCount = category.attemptedCount || 0;
            totalQuizzCount = category.quizzCount || 0;
        } else {
            // All Quizzes: sum up counts from all categories
            initialAttemptedCount = categories.reduce((sum, cat) => sum + (cat.attemptedCount || 0), 0);
            totalQuizzCount = categories.reduce((sum, cat) => sum + (cat.quizzCount || 0), 0);
        }

        navigation.navigate('QuizzPlay', {
            categoryId: category?._id || null,
            categoryName: category ? category.name : 'All Quizzes',
            initialAttemptedCount,
            totalQuizzCount
        });
    };

    const renderHeader = useCallback(() => {
        return (
            <TouchableOpacity
                style={styles.allQuizzesCard}
                onPress={() => handleCategoryPress(null)}
                activeOpacity={0.9}
            >
                <View style={styles.allQuizzesGradient}>
                    <MaterialCommunityIcons name="all-inclusive" size={32} color="#fff" />
                    <Text style={styles.categoryCardName}>All Quizzes</Text>
                </View>
            </TouchableOpacity>
        );
    }, []);

    const renderCategoryItem = useCallback(({ item }) => {
        const attemptedCount = item.attemptedCount || 0;
        const totalCount = item.quizzCount || 0;
        const progress = totalCount > 0 ? attemptedCount / totalCount : 0;

        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item)}
            >
                <View style={styles.categoryCardContent}>
                    <Text style={styles.progressText}>
                        {attemptedCount}/{totalCount}
                    </Text>
                    <View style={styles.categoryIconContainer}>
                        <MaterialCommunityIcons name="brain" size={24} color={Colors.brand.darkPink} />
                    </View>
                    <View style={styles.categoryTextContainer}>
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, []);

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
            <View style={{ flex: 1, backgroundColor: '#FFF0F5' }}>
                <SafeAreaView style={styles.container}>
                    <CategorySkeleton />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#FFF0F5' }}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
                <FlatList
                    data={categories}
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
        paddingTop: 40,
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
    allQuizzesCard: {
        width: screenWidth - 24, // 12 padding on each side of list
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden', // Ensure gradient child clips to borderRadius
    },
    allQuizzesGradient: {
        width: '100%',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        height: 130,
        backgroundColor: '#FF6B8A', // Solid pink color instead of gradient
    },
    categoryCardName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 8,
        textAlign: 'center',
    },
    categoryCardContent: {
        alignItems: 'center',
        padding: 16,
        justifyContent: 'center',
        height: 140,
    },
    categoryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF0F5',
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
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressText: {
        position: 'absolute',
        top: 12,
        right: 12,
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF', // Subtle gray
    },
});
