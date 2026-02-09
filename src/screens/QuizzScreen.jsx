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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { API_BASE } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DepartmentIcons } from '../components/DepartmentIcons';

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

    // Local state instead of Redux
    const [categories, setCategories] = useState([]);
    const [categoriesStatus, setCategoriesStatus] = useState('idle');

    // Fetch categories directly
    const fetchCategories = useCallback(async () => {
        setCategoriesStatus('loading');
        try {
            const url = userId
                ? `${API_BASE}/api/quizz/category?userId=${userId}`
                : `${API_BASE}/api/quizz/category`;
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

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [fetchCategories])
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

        return (
            <TouchableOpacity
                style={styles.allQuizzesCard}
                onPress={() => handleCategoryPress(null)}
                activeOpacity={0.9}
            >
                <View style={styles.allQuizzesGradient}>
                    <MaterialCommunityIcons name="all-inclusive" size={32} color="#fff" />
                    <Text style={styles.categoryCardName}>All Quizzes</Text>
                    <Text style={styles.randomPlayText}>Click here to play 1000+ cases</Text>
                </View>
            </TouchableOpacity>
        );
    }, [categories, handleCategoryPress]);

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
            <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                <SafeAreaView style={styles.container}>
                    <CategorySkeleton />
                </SafeAreaView>
            </View>
        );
    }

    const filteredCategories = categories.filter(cat => (cat.quizzCount || 0) > 0);

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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

    randomPlayText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginTop: 4,
        textDecorationLine: 'underline',
    },
});
