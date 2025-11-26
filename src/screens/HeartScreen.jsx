import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { useSelector, useDispatch } from 'react-redux';
import PremiumBottomSheet from '../components/PremiumBottomSheet';
import heartImage from '../../constants/heart.png';
import LinearGradient from 'react-native-linear-gradient';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];


export default function HeartScreen() {
  // Static, presentational values (no calculations)
  const { hearts } = useSelector(state => state.user);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const premiumSheetRef = React.useRef(null);
  const MAX_HEARTS_DISPLAY = 3;
  const heartsToShow = Math.min(hearts, MAX_HEARTS_DISPLAY);

  const onGoPro = () => {
    // navigation.navigate('Premium');
    // dispatch(useHeart());
    premiumSheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.container}>
        <LinearGradient
        colors={SUBTLE_PINK_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#2D3142" />
        </TouchableOpacity>
        {/* <Text style={styles.headerTitle}>Hearts</Text> */}
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.headerHero}>
        <Image source={heartImage} style={{ width: 200, height: 200 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>You can use 1 heart for every new case you solve.</Text>

        <View style={styles.card}>
          <View style={styles.heartsRow}>
            {Array.from({ length: MAX_HEARTS_DISPLAY }).map((_, idx) => {
              const filled = idx < heartsToShow;
              return (
                <Ionicons
                  key={idx}
                  name="heart"
                  size={44}
                  color={filled ? '#ff4d4f' : '#c8cbd0'}
                  style={styles.heartIcon}
                />
              );
            })}
          </View>
          <Text style={styles.cardMainText}>
            Today {hearts} {hearts === 1 ? 'Heart' : 'Hearts'} Left
          </Text>
        </View>

        <Text style={styles.subtitleSecondary}>Daily you will get 3 heart</Text>

        <View style={styles.cardAlt}>
          <Text style={styles.cardAltTitle}>Need More Hearts?</Text>
          <Text style={styles.cardAltSubtitle}>Keep playing without breaks — here’s how:</Text>

          <View style={styles.listRow}>
            <Ionicons name="checkmark-circle" size={20} color="#02b3a4" style={{ marginRight: 8 }} />
            <Text style={styles.listText}>
              Subscribe Premium: Unlock unlimited Hearts for nonstop learning.
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onGoPro} activeOpacity={0.9}>
            <Text style={styles.ctaButtonText}>Subscribe Premium →</Text>
          </TouchableOpacity>
        </View>
        <PremiumBottomSheet ref={premiumSheetRef} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
        paddingTop: 16,
    },
    header: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.brand.darkPink,
    },
    headerHero: {
        alignItems: 'center',
        justifyContent: 'center',
        // paddingVertical: 8,
    },
    scrollInner: {
        padding: 16,
        paddingBottom: 32,
        // flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#556070',
        fontSize: 16,
        marginTop: 4,
        marginBottom: 16,
    },
    subtitleSecondary: {
        textAlign: 'center',
        color: '#65727E',
        fontSize: 14,
        marginBottom: 16,
        marginTop: 6,
        fontWeight: '600',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EDEDED',
        alignItems: 'center',
        width: '100%',
    },
    heartsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    heartIcon: {
        marginHorizontal: 10,
    },
    cardMainText: {
        fontSize: 18,
        color: Colors.brand.darkPink,
        fontWeight: '700',
        marginBottom: 6,
    },
    cardTimerText: {
        fontSize: 16,
        color: '#e74c3c',
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: Colors.brand.darkPink,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 4,
    },
    primaryButtonDisabled: {
        backgroundColor: '#c2c2c2',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cardAlt: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EDEDED',
        marginTop: 16,
        width: '100%',
    },
    cardAltTitle: {
        color: Colors.brand.darkPink,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    cardAltSubtitle: {
        color: '#5B6474',
        fontSize: 15,
        marginBottom: 12,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    listText: {
        flex: 1,
        color: '#2D3142',
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#EDE4DA',
        marginVertical: 8,
    },
    ctaButton: {
        marginTop: 10,
        backgroundColor: Colors.brand.darkPink,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    ctaButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        marginTop: 10,
        borderColor: '#CBD5E1',
        borderWidth: 1,
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '700',
    },
});