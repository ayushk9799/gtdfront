import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LeagueHeader({ onPressPro }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10, flexWrap: 'nowrap', zIndex: 10, elevation: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 10 }}>
        <StatPill icon="coin" iconBg="#FFE8B0" iconColor="#CC8A00" label="2600" style={{ marginRight: 6 }} />
        <StatPill icon="heart" iconBg="#FFD1E1" iconColor="#C2185B" label="2" style={{ marginRight: 6 }} />
        <StatPill icon="fire" iconBg="#FFD7AE" iconColor="#FF6A00" label="4" />
      </View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPressPro}
        style={{
          backgroundColor: '#00C4B3',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          shadowColor: '#00C4B3',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        <Text style={{ color: '#ffffff', fontWeight: '800' }}>GO PRO</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatPill({ icon, iconBg, iconColor, label, style }) {
  return (
    <View style={[pillStyle(), { flexShrink: 1 }, style]}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
        <MaterialCommunityIcons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={pillText()}>{label}</Text>
    </View>
  );
}

function pillStyle() {
  return {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#1E88E5',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  };
}

function pillText() {
  return { fontWeight: '800', color: '#333333' };
}
