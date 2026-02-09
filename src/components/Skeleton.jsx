import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

/**
 * Unified Skeleton Loader System
 * 
 * A comprehensive skeleton loading component with shimmer animations,
 * theme support (light/dark mode), and multiple presets for common UI patterns.
 */

// ============================================================================
// CORE SKELETON COMPONENT
// ============================================================================

const SkeletonBase = memo(({
    width = '100%',
    height = 16,
    borderRadius,
    variant = 'default',
    style,
    animated = true,
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = isDark ? Colors.skeleton.dark : Colors.skeleton.light;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    // Border radius presets based on variant
    const radiusMap = {
        text: Colors.skeleton.borderRadius.xs,
        button: Colors.skeleton.borderRadius.xl,
        card: Colors.skeleton.borderRadius.lg,
        avatar: Colors.skeleton.borderRadius.full,
        image: Colors.skeleton.borderRadius.lg,
        icon: Colors.skeleton.borderRadius.md,
        default: Colors.skeleton.borderRadius.sm,
    };

    const finalRadius = borderRadius ?? radiusMap[variant] ?? radiusMap.default;

    useEffect(() => {
        if (!animated) return;

        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: Colors.skeleton.animation.duration,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: Colors.skeleton.animation.duration,
                    useNativeDriver: true,
                }),
            ])
        );
        shimmer.start();
        return () => shimmer.stop();
    }, [animated]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: theme.opacityRange,
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: finalRadius,
                    backgroundColor: theme.base,
                    opacity: animated ? opacity : theme.opacityRange[0],
                },
                style,
            ]}
        />
    );
});

SkeletonBase.displayName = 'SkeletonBase';

// ============================================================================
// SKELETON PRESETS
// ============================================================================

/**
 * Text skeleton - for single line text placeholders
 */
export const SkeletonText = memo(({
    width = '100%',
    lines = 1,
    spacing = 8,
    lastLineWidth = '60%',
    style
}) => (
    <View style={style}>
        {Array.from({ length: lines }).map((_, index) => (
            <SkeletonBase
                key={index}
                width={index === lines - 1 && lines > 1 ? lastLineWidth : width}
                height={14}
                variant="text"
                style={index < lines - 1 ? { marginBottom: spacing } : null}
            />
        ))}
    </View>
));

SkeletonText.displayName = 'SkeletonText';

/**
 * Title skeleton - for headings
 */
export const SkeletonTitle = memo(({ width = '70%', style }) => (
    <SkeletonBase
        width={width}
        height={20}
        variant="text"
        borderRadius={6}
        style={style}
    />
));

SkeletonTitle.displayName = 'SkeletonTitle';

/**
 * Button skeleton
 */
export const SkeletonButton = memo(({
    width = '100%',
    height = 48,
    style
}) => (
    <SkeletonBase
        width={width}
        height={height}
        variant="button"
        style={style}
    />
));

SkeletonButton.displayName = 'SkeletonButton';

/**
 * Image skeleton
 */
export const SkeletonImage = memo(({
    width = '100%',
    height = 200,
    borderRadius,
    style
}) => (
    <SkeletonBase
        width={width}
        height={height}
        variant="image"
        borderRadius={borderRadius}
        style={style}
    />
));

SkeletonImage.displayName = 'SkeletonImage';

/**
 * Avatar/Icon skeleton
 */
export const SkeletonAvatar = memo(({
    size = 48,
    circular = true,
    style
}) => (
    <SkeletonBase
        width={size}
        height={size}
        variant={circular ? 'avatar' : 'icon'}
        style={style}
    />
));

SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * Progress bar skeleton
 */
export const SkeletonProgress = memo(({
    width = '100%',
    height = 8,
    style
}) => (
    <SkeletonBase
        width={width}
        height={height}
        borderRadius={4}
        style={style}
    />
));

SkeletonProgress.displayName = 'SkeletonProgress';

// ============================================================================
// COMPOSITE SKELETON COMPONENTS
// ============================================================================

/**
 * Card skeleton with image, title, description, and button
 */
export const SkeletonCard = memo(({
    showImage = true,
    imageHeight = 200,
    showButton = true,
    style
}) => (
    <View style={[skeletonStyles.cardContainer, style]}>
        {showImage && (
            <SkeletonImage
                height={imageHeight}
                style={skeletonStyles.cardImage}
            />
        )}
        <SkeletonTitle style={skeletonStyles.cardTitle} />
        <SkeletonText
            width="60%"
            style={skeletonStyles.cardDescription}
        />
        {showButton && (
            <SkeletonButton style={skeletonStyles.cardButton} />
        )}
    </View>
));

SkeletonCard.displayName = 'SkeletonCard';

/**
 * List item skeleton with icon, title, and subtitle
 */
export const SkeletonListItem = memo(({
    showIcon = true,
    iconSize = 48,
    showProgress = false,
    style
}) => (
    <View style={[skeletonStyles.listItem, style]}>
        {showIcon && (
            <SkeletonAvatar
                size={iconSize}
                circular={false}
            />
        )}
        <View style={skeletonStyles.listItemContent}>
            <SkeletonTitle width="70%" style={skeletonStyles.listItemTitle} />
            {showProgress ? (
                <>
                    <SkeletonProgress style={skeletonStyles.listItemProgress} />
                    <SkeletonText width="40%" />
                </>
            ) : (
                <SkeletonText width="50%" />
            )}
        </View>
    </View>
));

SkeletonListItem.displayName = 'SkeletonListItem';

/**
 * Daily Challenge skeleton - specific preset for HomeScreen
 */
export const SkeletonDailyChallenge = memo(({ imageHeight = 200, style }) => (
    <View style={[{ marginTop: 12 }, style]}>
        <View style={{ height: imageHeight, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F5F5F5', marginBottom: 12 }}>
            <SkeletonImage height={imageHeight} borderRadius={16} />
            {/* Simulation of title overlay inside the image */}
            <View style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                <SkeletonTitle width="80%" style={{ height: 18, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>
        </View>
        <SkeletonButton />
    </View>
));

SkeletonDailyChallenge.displayName = 'SkeletonDailyChallenge';

/**
 * Department card skeleton - specific preset for HomeScreen
 */
export const SkeletonDepartmentCard = memo(({ style }) => (
    <View style={[skeletonStyles.departmentCard, style]}>
        <View style={skeletonStyles.departmentCardContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <SkeletonTitle width="60%" style={{ marginBottom: 0 }} />
                <SkeletonBase width={40} height={16} borderRadius={4} />
            </View>
            <SkeletonText lines={1} width="85%" style={{ marginBottom: 12 }} />
            <SkeletonProgress height={10} style={{ marginBottom: 2 }} />
        </View>
    </View>
));

SkeletonDepartmentCard.displayName = 'SkeletonDepartmentCard';

/**
 * Departments list skeleton
 */
export const SkeletonDepartmentsList = memo(({ count = 4, style }) => (
    <View style={[{ marginTop: 12 }, style]}>
        {Array.from({ length: count }).map((_, index) => (
            <SkeletonDepartmentCard key={index} />
        ))}
    </View>
));

SkeletonDepartmentsList.displayName = 'SkeletonDepartmentsList';

/**
 * Leaderboard skeleton - for league screens
 */
export const SkeletonLeaderboardItem = memo(({
    rank = 1,
    showMedal = false,
    style
}) => (
    <View style={[skeletonStyles.leaderboardItem, style]}>
        {showMedal ? (
            <SkeletonAvatar size={32} circular />
        ) : (
            <SkeletonBase width={24} height={20} variant="text" />
        )}
        <SkeletonAvatar size={44} circular style={{ marginLeft: 12 }} />
        <View style={skeletonStyles.leaderboardContent}>
            <SkeletonTitle width="60%" />
            <SkeletonText width="30%" style={{ marginTop: 4 }} />
        </View>
        <SkeletonBase width={50} height={20} variant="text" />
    </View>
));

SkeletonLeaderboardItem.displayName = 'SkeletonLeaderboardItem';

/**
 * Podium skeleton - for top 3 in leaderboard
 */
export const SkeletonPodium = memo(({ style }) => (
    <View style={[skeletonStyles.podiumContainer, style]}>
        {/* 2nd place */}
        <View style={skeletonStyles.podiumItem}>
            <SkeletonAvatar size={60} circular />
            <SkeletonText width={60} style={{ marginTop: 8, alignSelf: 'center' }} />
            <SkeletonBase width={50} height={60} style={{ marginTop: 8 }} />
        </View>
        {/* 1st place */}
        <View style={[skeletonStyles.podiumItem, { marginTop: -20 }]}>
            <SkeletonAvatar size={80} circular />
            <SkeletonText width={70} style={{ marginTop: 8, alignSelf: 'center' }} />
            <SkeletonBase width={50} height={80} style={{ marginTop: 8 }} />
        </View>
        {/* 3rd place */}
        <View style={skeletonStyles.podiumItem}>
            <SkeletonAvatar size={60} circular />
            <SkeletonText width={60} style={{ marginTop: 8, alignSelf: 'center' }} />
            <SkeletonBase width={50} height={40} style={{ marginTop: 8 }} />
        </View>
    </View>
));

SkeletonPodium.displayName = 'SkeletonPodium';

/**
 * Case item skeleton - specific preset for DepartmentCasesScreen
 */
export const SkeletonCaseItem = memo(({ style }) => (
    <View style={[skeletonStyles.caseItem, style]}>
        <View style={skeletonStyles.caseItemContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <SkeletonBase width={60} height={14} borderRadius={4} />
            </View>
            <SkeletonTitle width="85%" style={{ height: 18, marginBottom: 4 }} />
            <SkeletonText lines={2} width="95%" />
        </View>
        <SkeletonBase width={84} height={64} borderRadius={12} style={{ marginLeft: 12 }} />
    </View>
));

SkeletonCaseItem.displayName = 'SkeletonCaseItem';

/**
 * Cases list skeleton
 */
export const SkeletonCasesList = memo(({ count = 5, style }) => (
    <View style={[{ padding: 16 }, style]}>
        {Array.from({ length: count }).map((_, index) => (
            <SkeletonCaseItem key={index} />
        ))}
    </View>
));

SkeletonCasesList.displayName = 'SkeletonCasesList';

// ============================================================================
// STYLES
// ============================================================================

const skeletonStyles = StyleSheet.create({
    // Card styles
    cardContainer: {
        marginTop: 8,
    },
    cardImage: {
        marginBottom: 12,
    },
    cardTitle: {
        marginBottom: 8,
    },
    cardDescription: {
        marginBottom: 16,
    },
    cardButton: {},

    // List item styles
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    listItemContent: {
        flex: 1,
        marginLeft: 12,
    },
    listItemTitle: {
        marginBottom: 8,
    },
    listItemProgress: {
        marginBottom: 6,
    },

    // Department card styles
    departmentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ECEFF4',
    },
    departmentCardContent: {
        flex: 1,
    },

    // Leaderboard styles
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    leaderboardContent: {
        flex: 1,
        marginLeft: 12,
    },

    // Podium styles
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    podiumItem: {
        alignItems: 'center',
        marginHorizontal: 10,
    },

    // Case item styles
    caseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ECEFF4',
    },
    caseItemContent: {
        flex: 1,
    },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Default export is the base skeleton component
export default SkeletonBase;

// Named export for the complete skeleton system
export const Skeleton = {
    Base: SkeletonBase,
    Text: SkeletonText,
    Title: SkeletonTitle,
    Button: SkeletonButton,
    Image: SkeletonImage,
    Avatar: SkeletonAvatar,
    Progress: SkeletonProgress,
    Card: SkeletonCard,
    ListItem: SkeletonListItem,
    DailyChallenge: SkeletonDailyChallenge,
    DepartmentCard: SkeletonDepartmentCard,
    DepartmentsList: SkeletonDepartmentsList,
    LeaderboardItem: SkeletonLeaderboardItem,
    Podium: SkeletonPodium,
    CaseItem: SkeletonCaseItem,
    CasesList: SkeletonCasesList,
};
