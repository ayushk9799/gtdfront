import React, { useEffect } from 'react';
import { useColorScheme, View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import LeagueHeader from './LeagueHeader';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTop10 } from '../store/slices/leaderboardSlice';
import rankingImage from '../../constants/ranking.png';
// import rankingImage1 from '../../constants/ranking1.png';


export default function LeagueScreen() {
  const themeColors = Colors.light;
  const dispatch = useDispatch();
  const { items: top10, me, status, error } = useSelector((state) => state.leaderboard || { items: [], me: null, status: 'idle', error: null });
  const currentUserId = useSelector((state) => state.user?.userData?._id);

  useEffect(() => {
    dispatch(fetchTop10(currentUserId));
  }, [dispatch, currentUserId]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top','left','right']}>
     
        {/* <LeagueHeader onPressPro={() => {}} /> */}
      {/* </View> */}

      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 8 }}>
        {/* big heart badge placeholder */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
          {/* <View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFD1E1', alignItems: 'center', justifyContent: 'center', shadowColor: '#C2185B', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFB6CE', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF8FB6', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#7C2A4A' }} />
              </View>
            </View>
          </View> */}
          <View style={{ width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <Image source={rankingImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.4)']}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0)', '#FFFFFF']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 160,
              }}
            />
            <View style={{ position: 'absolute', bottom: 32, width: '100%', alignItems: 'center', paddingHorizontal: 24 }}>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.brand.darkPink }}>Top Learners</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#4A4A4A', marginTop: 4, textAlign: 'center' }}>
                  Leaderboard
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* title and subtitle */}
      
        {/* current user position */}
       

        {/* section headers */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>LEARNER</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>Score</Text>
        </View>

        {/* leaderboard list */}
        {(status === 'loading' ? Array.from({ length: 5 }).map((_, idx) => ({ rank: idx + 1, name: 'Loading...', score: 0 })) : top10).map((item, idx) => {
          const isMe = me && item?.userId && me?.userId && String(item.userId) === String(me.userId);
          const cardBg = isMe ? '#E9FFFA' : '#ffffff';
          const cardBorder = isMe ? '#10B981' : themeColors.border;
          return (
            <View
              key={idx}
              style={{
                borderRadius: 16,
                borderWidth: 2,
                borderColor: cardBorder,
                backgroundColor: cardBg,
                paddingVertical: 14,
                paddingHorizontal: 14,
                marginBottom: 12,
                shadowColor: '#1E88E5',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', color: '#6B7280' }}>{item.rank || idx + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: themeColors.text }} numberOfLines={1} ellipsizeMode="tail">{item.name || '...'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#00A37A' }}>{(Math.round(item.score ?? 0) > 0 ? '+' : '') + Math.round(item.score ?? 0)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* show my rank after top 10 if I'm not in top 10 */}
        {me && me.rank > 10 ? (
          <>
            <View style={{ alignItems: 'center', marginVertical: 4 }}>
              <Text style={{ color: '#9CA3AF' }}>...</Text>
            </View>
            <View
              style={{
                borderRadius: 16,
                borderWidth: 2,
                borderColor: '#10B981',
                backgroundColor: '#E9FFFA',
                paddingVertical: 14,
                paddingHorizontal: 14,
                marginBottom: 12,
                shadowColor: '#1E88E5',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', color: '#6B7280' }}>{me.rank}</Text>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFE0B2', marginRight: 12 }} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: themeColors.text }} numberOfLines={1} ellipsizeMode="tail">{me.name || 'You'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#00A37A' }}>{(Math.round(me.score ?? 0) > 0 ? '+' : '') + Math.round(me.score ?? 0)}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}


