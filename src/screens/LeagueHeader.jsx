import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from 'react-native';
import coinIcon from '../../constants/coin.png';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function LeagueHeader() {
  const navigation = useNavigation();
  const { isPremium, userData } = useSelector(state => state.user);
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  return (
    <View style={styles.container}>
      <View style={styles.brandWrap}>
        <Text style={styles.brandText} numberOfLines={1}>Diagnose it</Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Premium')}
          style={[
            styles.membershipButton,
            isPremium ? styles.premiumButton : styles.upgradeButton,
            isNarrow && styles.membershipButtonNarrow,
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={isPremium ? 'Pro membership' : 'Upgrade to Pro'}
        >
          <MaterialCommunityIcons
            name="crown"
            size={15}
            color={isPremium ? '#FFFFFF' : '#08A82E'}
          />
          {!isNarrow && (
            <Text style={isPremium ? styles.premiumText : styles.upgradeText}>
              {isPremium ? 'Pro' : 'Upgrade'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={pillStyle()}>
          <Image source={coinIcon} style={styles.coinIcon} />
          <Text style={pillText()}>{parseInt(userData?.cumulativePoints?.total || 0, 10)}</Text>
        </View>
      </View>
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
    flexShrink: 1,
  };
}

function pillText() {
  return { fontWeight: '800', color: '#333333', marginLeft: 3 };
}

const styles = StyleSheet.create({
  coinIcon: {
    width: 18,
    height: 18,
  },
  container: {
    zIndex: 10,
    elevation: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  brandText: {
    color: '#FF407D',
    fontSize: 24,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipButton: {
    minHeight: 32,
    minWidth: 32,
    marginRight: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipButtonNarrow: {
    paddingHorizontal: 8,
  },
  premiumButton: {
    backgroundColor: '#08C634',
    shadowColor: '#00C4B3',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  premiumText: {
    marginLeft: 5,
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  upgradeButton: {
    borderWidth: 1,
    borderColor: '#08C634',
    backgroundColor: '#F4FFF6',
  },
  upgradeText: {
    marginLeft: 5,
    color: '#08A82E',
    fontWeight: '800',
    fontSize: 13,
  },
});
