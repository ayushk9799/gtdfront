import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import inappicon from '../../constants/inappicon.png';
import { useNavigation } from '@react-navigation/native';

export default function LeagueHeader() {
  const navigation = useNavigation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10, flexWrap: 'nowrap', zIndex: 10, elevation: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 10 }}>
       
        {/* <Image source={inappicon} style={{ width: 36, height: 36 }} /> */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#FF407D' }}>Diagnose it</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Premium')}
          style={{
            backgroundColor: '#08C634',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            shadowColor: '#00C4B3',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
            marginLeft: 6,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>Pro</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 5, flexWrap: 'nowrap', zIndex: 10, elevation: 4 }}>
         {/* <StatPill icon="heart" iconBg="#FFD1E1" iconColor="#FF0000" label="2" style={{ marginRight: 6 }} /> */}
        <StatPill icon="fire" iconBg="#FFD7AE" iconColor="#FF6A00" label="100" /> 
      </View>
    </View>
  );
}

function StatPill({ icon, iconBg, iconColor, label, style }) {
  return (
    <View style={[pillStyle(), { flexShrink: 1 }, style]}>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={'heart'} size={12} color={iconColor} />
      </View>
      <Text style={pillText()}>{3}</Text>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
        <MaterialCommunityIcons name={'fire'} size={10} color={iconColor} />
      </View>
      <Text style={pillText()}>{2000}</Text>
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
  return { fontWeight: '800', color: '#333333', marginLeft : 3 };
}
