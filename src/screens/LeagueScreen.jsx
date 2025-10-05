import React from 'react';
import { useColorScheme, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import LeagueHeader from './LeagueHeader';

const leaderboard = [
  { rank: 1, name: 'Ward Watcher', xp: 1402, accent: '#FFF7E6' },
  { rank: 2, name: 'Hymenolepsis Nana', xp: 705, accent: '#E6F7FF' },
  { rank: 3, name: 'Medborn Sentinel', xp: 477, accent: '#FFF7E6' },
  { rank: 4, name: 'Healer Hardik', xp: 454, accent: '#E9FFFA', outlined: true },
  { rank: 14, name: 'Rajiv Ranjan', xp: 190, accent: '#FFF3E8', highlight: true },
];

export default function LeagueScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} stickyHeaderIndices={[0]}>
        {/* sticky header */}
        <LeagueHeader onPressPro={() => {}} />

        {/* big heart badge placeholder */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 18 }}>
          <View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFD1E1', alignItems: 'center', justifyContent: 'center', shadowColor: '#C2185B', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFB6CE', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF8FB6', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#7C2A4A' }} />
              </View>
            </View>
          </View>
        </View>

        {/* title and subtitle */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: themeColors.text }}>Medical Student</Text>
          <Text style={{ marginTop: 6, color: '#5B6470' }}>Every expert was once here.</Text>
        </View>

        {/* section headers */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>LEARNER</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280' }}>XP THIS WEEK</Text>
        </View>

        {/* leaderboard list */}
        {leaderboard.map((item, idx) => (
          <View
            key={idx}
            style={{
              borderRadius: 16,
              borderWidth: item.outlined ? 2 : 1,
              borderColor: item.highlight ? '#FFA500' : (item.outlined ? '#2DD4BF' : themeColors.border),
              backgroundColor: item.highlight ? '#FFF3E8' : '#ffffff',
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
                  <Text style={{ fontWeight: '800', color: '#6B7280' }}>{item.rank}</Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFE0B2', marginRight: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: themeColors.text }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#00A37A' }}>+{item.xp}</Text>
                <Text style={{ fontSize: 12, color: '#00A37A' }}>{item.xp}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}


