import React, { useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import LeagueHeader from './LeagueHeader';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTop10 } from '../store/slices/leaderboardSlice';
import rankingImage from '../../constants/ranking.png';
import CloudBottom from '../components/CloudBottom';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

export default function LeagueScreen() {
  const themeColors = Colors.light;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { items: top10, me, status, error } = useSelector((state) => state.leaderboard || { items: [], me: null, status: 'idle', error: null });
  const currentUserId = useSelector((state) => state.user?.userData?._id);

  useEffect(() => {
    dispatch(fetchTop10(currentUserId));
  }, [dispatch, currentUserId]);

  // Separate top 3 for podium display
  const top3 = status === 'loading'
    ? Array.from({ length: 3 }).map((_, idx) => ({ rank: idx + 1, name: 'Loading...', score: 0 }))
    : top10.slice(0, 3);

  const restLeaderboard = status === 'loading'
    ? Array.from({ length: 2 }).map((_, idx) => ({ rank: idx + 4, name: 'Loading...', score: 0 }))
    : top10.slice(3);

  const renderPodiumPlayer = (player, position) => {
    if (!player) return null;
    const config = medalConfig[position];
    const isCenter = position === 1;
    const size = isCenter ? 80 : 64;
    const fontSize = isCenter ? 16 : 14;

    return (
      <View style={[styles.podiumItem, isCenter && styles.podiumItemCenter]}>
        <LinearGradient
          colors={config.gradient}
          style={[styles.avatarGradient, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}
        >
          <View style={[styles.avatarInner, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bgColor }]}>
            <Text style={[styles.avatarText, { fontSize: fontSize + 4 }]}>{getInitials(player.name)}</Text>
          </View>
        </LinearGradient>
        <Text style={[styles.podiumName, { fontSize }]} numberOfLines={1} ellipsizeMode="tail">
          {player.name || '...'}
        </Text>
        <View style={[styles.podiumScoreBadge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
          <MaterialCommunityIcons name="star" size={12} color={config.gradient[0]} />
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
            <MaterialCommunityIcons name="trophy" size={16} color="#FFB800" />
            <Text style={styles.scoreText}>
              {Math.round(item.score ?? 0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFBFC' }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Image */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <Image source={rankingImage} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)']}
              style={styles.imageOverlay}
            />
            <LinearGradient
              colors={['rgba(250,251,252,0)', '#FAFBFC']}
              style={styles.bottomFade}
            />
          </View>
          {/* Title badge positioned outside imageContainer to avoid clipping */}
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={['#FF407D', '#FF6B9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.titleBadge}
            >
              <MaterialCommunityIcons name="trophy-variant" size={24} color="#FFF" />
              <Text style={styles.heroTitle}>Leaderboard</Text>
            </LinearGradient>
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

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerBadge}>
            <MaterialCommunityIcons name="account-group" size={16} color="#6B7280" />
            <Text style={styles.dividerText}>All Participants</Text>
          </View>
          <View style={styles.dividerLine} />
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
        </View>

        <View style={{ height: 100 }} />
        <CloudBottom height={160} bottomOffset={insets?.bottom + 56} color={"#FF407D"} style={{ opacity: 0.25 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 16,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
  titleContainer: {
    alignItems: 'center',
    marginTop: -90,
    zIndex: 10,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#FF407D',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  podiumSection: {
    paddingHorizontal: 16,
    marginTop: 24,
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
  podiumMedalContainer: {
    marginBottom: 8,
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
    fontSize: 13,
    fontWeight: '800',
  },
  podiumBase: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBase1: {
    width: 90,
    height: 70,
    backgroundColor: '#FFD700',
    shadowColor: '#DAA520',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  podiumBase2: {
    width: 80,
    height: 50,
    backgroundColor: '#C0C0C0',
    shadowColor: '#A0A0A0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  podiumBase3: {
    width: 80,
    height: 40,
    backgroundColor: '#CD7F32',
    shadowColor: '#8B4513',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  podiumBaseText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
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
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  leaderboardCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    maxWidth: '70%',
  },
  youBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 15,
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


