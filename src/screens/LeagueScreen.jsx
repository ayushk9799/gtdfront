import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTop10 } from '../store/slices/leaderboardSlice';
import { fetchTodayDailyLeaderboard } from '../store/slices/dailyChallengeLeaderboardSlice';
import rankingImage from '../../constants/ranking.png';
import coinIcon from '../../constants/coin.png';
import CloudBottom from '../components/CloudBottom';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

// Helper function to get initials from name
const getInitials = (name) => {
    if (!name || name === '...') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

// Medal configurations for top 3
const medalConfig = {
    1: { emoji: '🥇', gradient: ['#FFD700', '#FFA500'], borderColor: '#DAA520', bgColor: '#FFFACD' },
    2: { emoji: '🥈', gradient: ['#C0C0C0', '#A8A8A8'], borderColor: '#A0A0A0', bgColor: '#F5F5F5' },
    3: { emoji: '🥉', gradient: ['#CD7F32', '#A0522D'], borderColor: '#8B4513', bgColor: '#FFE4C4' },
};

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

export default function LeagueScreen() {
    const themeColors = Colors.light;
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    // Tab state: 0 = Overall, 1 = Daily Challenge
    const [activeTab, setActiveTab] = useState(0);

    // Overall leaderboard state
    const { items: top10, me, status, error } = useSelector((state) => state.leaderboard || { items: [], me: null, status: 'idle', error: null });
    const currentUserId = useSelector((state) => state.user?.userData?._id);

    // Daily challenge leaderboard state
    const dailyLeaderboard = useSelector((state) => state.dailyChallengeLeaderboard || {});
    const {
        items: dailyTop10 = [],
        me: dailyMe = null,
        date: dailyDate = null,
        challengeTitle = '',
        category = '',
        totalParticipants = 0,
        status: dailyStatus = 'idle',
        error: dailyError = null,
    } = dailyLeaderboard;

    // Fetch overall leaderboard
    useEffect(() => {
        dispatch(fetchTop10(currentUserId));
    }, [dispatch, currentUserId]);

    // Fetch daily challenge leaderboard when tab changes
    useEffect(() => {
        if (activeTab === 1 && dailyStatus === 'idle') {
            dispatch(fetchTodayDailyLeaderboard({ userId: currentUserId }));
        }
    }, [activeTab, dailyStatus, dispatch, currentUserId]);

    // Share daily challenge with friends
    const handleShareChallenge = async () => {
        try {
            const dateText = dailyDate ? formatDate(dailyDate) : 'today';
            const title = challengeTitle || 'Daily Challenge';
            const appLink = 'https://diagnoseit.app/download'; // Replace with actual app link

            await Share.share({
                message: `Can you solve today's medical case?\n\n"${title}"\n📅 \n\nI just completed this daily challenge on Diagnose It! Download the app and see if you can beat my score! 🎯\n\n👉 ${appLink}\n\n#DiagnoseIt #MedicalCase #DailyChallenge`,
                title: 'Challenge your friends!',
                url: appLink, // iOS will use this as the shared URL
            });
        } catch (error) {
        }
    };

    // Separate top 3 for podium display
    const top3 = status === 'loading'
        ? Array.from({ length: 3 }).map((_, idx) => ({ rank: idx + 1, name: 'Loading...', score: 0 }))
        : top10.slice(0, 3);

    const restLeaderboard = status === 'loading'
        ? Array.from({ length: 2 }).map((_, idx) => ({ rank: idx + 4, name: 'Loading...', score: 0 }))
        : top10.slice(3);

    // Daily challenge top 3 for podium
    const dailyTop3 = dailyStatus === 'loading'
        ? Array.from({ length: 3 }).map((_, idx) => ({ rank: idx + 1, name: 'Loading...', score: 0 }))
        : dailyTop10.slice(0, 3);

    const dailyRestLeaderboard = dailyStatus === 'loading'
        ? Array.from({ length: 2 }).map((_, idx) => ({ rank: idx + 4, name: 'Loading...', score: 0 }))
        : dailyTop10.slice(3);

    const renderPodiumPlayer = (player, position) => {
        if (!player) return null;
        const config = medalConfig[position];
        const isCenter = position === 1;
        const size = isCenter ? 64 : 52;
        const fontSize = isCenter ? 12 : 11;

        return (
            <View style={[styles.podiumItem, isCenter && styles.podiumItemCenter]}>
                <Text style={{ fontSize: isCenter ? 24 : 20, marginBottom: 4 }}>{config.emoji}</Text>
                <LinearGradient
                    colors={config.gradient}
                    style={[styles.avatarGradient, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}
                >
                    <View style={[styles.avatarInner, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bgColor }]}>
                        <Text style={[styles.avatarText, { fontSize: fontSize + 2 }]}>{getInitials(player.name)}</Text>
                    </View>
                </LinearGradient>
                <Text style={[styles.podiumName, { fontSize }]} numberOfLines={1} ellipsizeMode="tail">
                    {player.name || '...'}
                </Text>
                <View style={[styles.podiumScoreBadge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
                    <Image source={coinIcon} style={{ width: 12, height: 12 }} />
                    <Text style={[styles.podiumScore, { color: config.gradient[1] }]}>
                        {Math.round(player.score ?? 0)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderLeaderboardItem = (item, idx, isMe = false) => {
        const rank = item.rank || idx + 4;
        const cardBg = isMe ? '#E9FFFA' : '#FFFFFF';
        const cardBorder = isMe ? '#10B981' : 'transparent';

        // Generate avatar color based on rank
        const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const avatarBg = avatarColors[(rank - 1) % avatarColors.length];

        return (
            <View
                key={idx}
                style={[
                    styles.leaderboardCard,
                    {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        borderWidth: isMe ? 2 : 0,
                    },
                ]}
            >
                <View style={styles.leaderboardCardInner}>
                    {/* Rank Badge */}
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{rank}</Text>
                    </View>

                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                        <Text style={styles.avatarSmallText}>{getInitials(item.name)}</Text>
                    </View>

                    {/* Name */}
                    <View style={styles.nameContainer}>
                        <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
                            {item.name || '...'}
                        </Text>
                        {isMe && <Text style={styles.youBadge}>You</Text>}
                    </View>

                    {/* Score */}
                    <View style={styles.scoreContainer}>
                        <Image source={coinIcon} style={{ width: 18, height: 18 }} />
                        <Text style={styles.scoreText}>
                            {Math.round(item.score ?? 0)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    // Render tab bar
    const renderTabBar = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 0 && styles.tabButtonActive]}
                onPress={() => setActiveTab(0)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name="trophy"
                    size={18}
                    color={activeTab === 0 ? '#FF407D' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
                    Overall
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabButton, activeTab === 1 && styles.tabButtonActive]}
                onPress={() => setActiveTab(1)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name="calendar-today"
                    size={18}
                    color={activeTab === 1 ? '#FF407D' : '#9CA3AF'}
                />
                <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
                    Daily Challenge
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Render daily challenge header info
    const renderDailyChallengeHeader = () => {
        if (dailyStatus === 'loading') {
            return (
                <View style={styles.dailyHeader}>
                    <ActivityIndicator size="small" color="#FF407D" />
                </View>
            );
        }

        if (dailyError || dailyTop10.length === 0) {
            return (
                <View style={styles.dailyHeader}>
                    <View style={styles.noChallengeContainer}>
                        <MaterialCommunityIcons name="calendar-remove" size={48} color="#D1D5DB" />
                        <Text style={styles.noChallengeTitle}>No Rankings Yet</Text>
                        <Text style={styles.noChallengeSubtitle}>
                            {dailyError || 'No one has completed today\'s challenge yet. Be the first!'}
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.dailyHeader}>
                <View style={styles.dailyDateBadge}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#FF407D" />
                    <Text style={styles.dailyDateText}>{formatDate(dailyDate)}</Text>
                </View>
                <Text style={styles.dailyChallengeTitle} numberOfLines={2}>
                    {challengeTitle || 'Daily Challenge'}
                </Text>
                {category ? (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{category}</Text>
                    </View>
                ) : null}
                <Text style={styles.participantsText}>
                    {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
                </Text>

                {/* Share Button */}

            </View>
        );
    };

    // Render overall leaderboard content
    const renderOverallContent = () => (
        <>
            {/* Hero Section with Image */}
            <View style={styles.heroSection}>
                <View style={styles.imageContainer}>
                    <Image source={rankingImage} style={styles.heroImage} resizeMode="contain" />
                    <LinearGradient
                        colors={['rgba(238, 163, 190, 0)', '#f7eaeeff']}
                        style={styles.bottomFade}
                    />
                </View>
            </View>

            {/* Top 3 Podium */}
            <View style={styles.podiumSection}>
                <View style={styles.podiumContainer}>
                    {/* 2nd Place - Left */}
                    <View style={styles.podiumSide}>
                        {renderPodiumPlayer(top3[1], 2)}
                    </View>

                    {/* 1st Place - Center */}
                    <View style={styles.podiumCenter}>
                        {renderPodiumPlayer(top3[0], 1)}
                    </View>

                    {/* 3rd Place - Right */}
                    <View style={styles.podiumSide}>
                        {renderPodiumPlayer(top3[2], 3)}
                    </View>
                </View>
            </View>

            {/* Rest of Leaderboard */}
            <View style={styles.leaderboardContainer}>
                {/* Header */}
                <View style={styles.listHeader}>
                    <Text style={styles.listHeaderText}>RANK</Text>
                    <Text style={[styles.listHeaderText, { flex: 1, marginLeft: 60 }]}>PLAYER</Text>
                    <Text style={styles.listHeaderText}>SCORE</Text>
                </View>

                {/* List Items */}
                {restLeaderboard.map((item, idx) => {
                    const isMe = me && item?.userId && me?.userId && String(item.userId) === String(me.userId);
                    return renderLeaderboardItem(item, idx, isMe);
                })}

                {/* Show user's rank if not in top 10 */}
                {me && me.rank > 10 && (
                    <>
                        <View style={styles.ellipsisContainer}>
                            <View style={styles.ellipsisDot} />
                            <View style={styles.ellipsisDot} />
                            <View style={styles.ellipsisDot} />
                        </View>
                        {renderLeaderboardItem(me, 0, true)}
                    </>
                )}

                {/* Challenge Friends Button */}
                <View style={styles.challengeFriendsContainer}>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShareChallenge}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="share-variant" size={18} color="#FFFFFF" />
                        <Text style={styles.shareButtonText}>Challenge Friends</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );

    // Render daily challenge leaderboard content
    const renderDailyContent = () => (
        <>
            {/* Daily Challenge Header */}
            {renderDailyChallengeHeader()}

            {dailyTop10.length > 0 && (
                <>
                    {/* Top 3 Podium */}
                    <View style={[styles.podiumSection, { marginTop: 0 }]}>
                        <View style={styles.podiumContainer}>
                            {/* 2nd Place - Left */}
                            <View style={styles.podiumSide}>
                                {dailyTop3[1] && renderPodiumPlayer(dailyTop3[1], 2)}
                            </View>

                            {/* 1st Place - Center */}
                            <View style={styles.podiumCenter}>
                                {dailyTop3[0] && renderPodiumPlayer(dailyTop3[0], 1)}
                            </View>

                            {/* 3rd Place - Right */}
                            <View style={styles.podiumSide}>
                                {dailyTop3[2] && renderPodiumPlayer(dailyTop3[2], 3)}
                            </View>
                        </View>
                    </View>

                    {/* Rest of Leaderboard - Only show if more than 3 participants */}
                    {dailyRestLeaderboard.length > 0 && (
                        <View style={styles.leaderboardContainer}>
                            {/* Header */}
                            <View style={styles.listHeader}>
                                <Text style={styles.listHeaderText}>RANK</Text>
                                <Text style={[styles.listHeaderText, { flex: 1, marginLeft: 60 }]}>PLAYER</Text>
                                <Text style={styles.listHeaderText}>SCORE</Text>
                            </View>

                            {/* List Items */}
                            {dailyRestLeaderboard.map((item, idx) => {
                                const isMe = dailyMe && item?.userId && dailyMe?.userId && String(item.userId) === String(dailyMe.userId);
                                return renderLeaderboardItem(item, idx, isMe);
                            })}

                            {/* Show user's rank if not in top 10 */}
                            {dailyMe && dailyMe.rank > 10 && (
                                <>
                                    <View style={styles.ellipsisContainer}>
                                        <View style={styles.ellipsisDot} />
                                        <View style={styles.ellipsisDot} />
                                        <View style={styles.ellipsisDot} />
                                    </View>
                                    {renderLeaderboardItem(dailyMe, 0, true)}
                                </>
                            )}
                        </View>
                    )}

                    {/* Show encouragement when user is the only participant */}
                    {dailyTop10.length === 1 && (
                        <View style={styles.encouragementContainer}>
                            <Text style={styles.encouragementText}>🎉 You're the first to complete today's challenge!</Text>
                            <Text style={styles.encouragementSubtext}>Challenge your friends to beat your score</Text>
                            <TouchableOpacity
                                style={styles.shareButton}
                                onPress={handleShareChallenge}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="share-variant" size={18} color="#FFFFFF" />
                                <Text style={styles.shareButtonText}>Challenge Friends</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </>
    );

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <View style={{ flex: 1 }}>
                <LinearGradient
                    colors={SUBTLE_PINK_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Tab Bar */}
                {renderTabBar()}

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 180, paddingTop: 8, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Render content based on active tab */}
                    {activeTab === 0 ? renderOverallContent() : renderDailyContent()}
                </ScrollView>

                {/* CloudBottom fixed at bottom */}
                <View style={styles.cloudContainer}>
                    <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.25 }} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Tab styles
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: '#FFF0F5',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    tabTextActive: {
        color: '#FF407D',
    },

    // Daily challenge header styles
    dailyHeader: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        alignItems: 'center',
    },
    dailyDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        marginBottom: 12,
    },
    dailyDateText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FF407D',
    },
    dailyChallengeTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F46E5',
    },
    participantsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    noChallengeContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noChallengeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B7280',
        marginTop: 12,
    },
    noChallengeSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 20,
    },
    encouragementContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: '#FFF9FB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE4ED',
    },
    encouragementText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    encouragementSubtext: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 6,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF407D',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
        shadowColor: '#FF407D',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    shareButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF407D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 16,
        gap: 8,
        shadowColor: '#FF407D',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    shareButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    challengeFriendsContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    cloudContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
    },

    // Existing styles
    heroSection: {
        paddingHorizontal: 16,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: '100%',
        maxHeight: 400,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        marginTop: -30,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    podiumSection: {
        paddingHorizontal: 16,
        marginTop: -120,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    podiumSide: {
        alignItems: 'center',
        flex: 1,
    },
    podiumCenter: {
        alignItems: 'center',
        flex: 1,
        marginBottom: 20,
    },
    podiumItem: {
        alignItems: 'center',
        marginBottom: 8,
    },
    podiumItemCenter: {
        marginBottom: 12,
    },
    avatarGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    avatarInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: '800',
        color: '#4A4A4A',
    },
    podiumName: {
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
        maxWidth: 90,
        textAlign: 'center',
    },
    podiumScoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 6,
        gap: 4,
    },
    podiumScore: {
        fontSize: 11,
        fontWeight: '800',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 0,
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 12,
        gap: 6,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    leaderboardContainer: {
        marginTop: 10,
        paddingHorizontal: 16,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    listHeaderText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.5,
    },
    leaderboardCard: {
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    leaderboardCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    rankBadge: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    avatarSmallText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    nameContainer: {
        flex: 1,
        marginLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    playerName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        maxWidth: '70%',
    },
    youBadge: {
        fontSize: 9,
        fontWeight: '700',
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
    },
    scoreText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
    },
    ellipsisContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    ellipsisDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D1D5DB',
    },
});