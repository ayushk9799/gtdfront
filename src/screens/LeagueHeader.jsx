import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Image, StyleSheet } from 'react-native';
import coinIcon from '../../constants/coin.png';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function LeagueHeader() {
  const navigation = useNavigation();
  const { isPremium, userData, hearts } = useSelector(state => state.user);



  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10, flexWrap: 'nowrap', zIndex: 10, elevation: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 10 }}>

        {/* <Image source={inappicon} style={{ width: 36, height: 36 }} /> */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#FF407D' }}>Diagnose it</Text>
        <View style={{ marginLeft: 6 }}>
          {isPremium ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Premium')}
              style={styles.premiumButton}
            >
              <Text style={styles.premiumText}>Pro</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.upgradeButton}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Premium')}
                style={styles.upgradeButtonInner}
              >
                <Text style={styles.upgradeText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate('Heart')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 5, flexWrap: 'nowrap', zIndex: 10, elevation: 4 }}>
        <View style={[pillStyle(), { flexShrink: 1 }]}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#FFD1E1", alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={'heart'} size={12} color="#FF0000" />
          </View>
          <Text style={pillText()}>{hearts}</Text>
          <Image source={coinIcon} style={{ width: 18, height: 18, marginLeft: 6 }} />
          <Text style={pillText()}>{parseInt(userData?.cumulativePoints?.total || 0)}</Text>
        </View>
      </Pressable>
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
  return { fontWeight: '800', color: '#333333', marginLeft: 3 };
}

const styles = StyleSheet.create({
  premiumButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#08C634',
    shadowColor: '#00C4B3',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  premiumText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  upgradeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#08C634',
    backgroundColor: 'transparent',
  },
  upgradeButtonInner: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  upgradeText: {
    color: '#08C634',
    fontWeight: '800',
    fontSize: 12,
  },
});
