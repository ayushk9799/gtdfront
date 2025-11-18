import React, {  useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, PermissionsAndroid, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { MMKV } from 'react-native-mmkv';
import messaging, {
  requestPermission,
  registerDeviceForRemoteMessages,
  subscribeToTopic,
  getMessaging,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/userSlice';
import { handleFCMTokenUpdate } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const storage = new MMKV();
const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function NotificationPermission() {
  const navigation = useNavigation();
  const themeColors = Colors.light;
  const dispatch = useDispatch();

  async function requestUserPermission() {
    if (Platform.OS === 'ios') {
      const status = await requestPermission(getMessaging(getApp()));
      return (
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL
      );
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }

    // Android < 13 requires no runtime permission
    return true;
  }

  const proceed = async () => {
    // Persist user's choice
    const granted = await requestUserPermission();
    storage.set('notifDecided', true);
    storage.set('notifEnabled', granted);
    
    // If granted, ensure device is registered and subscribe to topic
    if (granted) {
      try {
        await registerDeviceForRemoteMessages(getMessaging(getApp()));
      } catch (e) {
        console.warn('Failed to register device for remote messages (permission flow)', e);
      }
      try {
        await subscribeToTopic(getMessaging(getApp()), 'all_user');
      } catch (e) {
        console.warn('Failed to subscribe to topic all_user', e);
      }
    }
    
    // Get user data from local storage and update FCM token
    // The handleFCMTokenUpdate function will:
    // 1. Check current FCM token vs local stored token (update local if different)
    // 2. Check local token vs server token (update server only if different)
    const userDataString = storage.getString('user');
    if (userDataString) {
      try {
        const userDataParsed = JSON.parse(userDataString);
        await handleFCMTokenUpdate(dispatch, userDataParsed);
      } catch (e) {
        console.warn('Failed to parse user data for FCM token update', e);
      }
    }
    
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const skip = () => {
    storage.set('notifDecided', true);
    storage.set('notifEnabled', false);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF7FA', '#FFEAF2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerBg}
      />
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="bell-ring" size={28} color="#ffffff" />
        </View>
        <Text style={styles.title}>Build your habit with gentle nudges</Text>
        <Text style={styles.subtitle}>We’ll remind you once a day to keep your clinical skills sharp.</Text>
      </View>

      <View style={[styles.infoCard, styles.cardShadow]}>
        <Text style={styles.sectionTitle}>Why enable notifications?</Text>
        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.darkPink} />
            <Text style={styles.benefitText}>Daily reminder to complete a quick case</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.darkPink} />
            <Text style={styles.benefitText}>Turn on/off anytime from Account → Settings</Text>
          </View>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.brand.darkPink} />
            <Text style={styles.benefitText}>We never spam. Just a single nudge per day</Text>
          </View>
        </View>

        <View style={[styles.previewCard, styles.cardShadow]}>
          <View style={styles.previewIconWrap}>
            <Image source={require('../../constants/inappicon.png')} style={styles.previewIcon} resizeMode="contain" />
          </View>
          <View style={styles.previewTexts}>
            <Text style={styles.previewTitle}>Practice time</Text>
            <Text style={styles.previewBody}>Your daily case awaits. Ready for today’s challenge?</Text>
          </View>
          <Text style={styles.previewTime}>9:00 AM</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
          <MaterialCommunityIcons name="shield-lock-outline" size={14} color="#6B7280" />
          <Text style={styles.finePrint}>  You can change this anytime in Settings. One reminder per day — no spam.</Text>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={proceed} activeOpacity={0.9}>
          <LinearGradient
            colors={["#F472B6", "#FB7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          />
          <Text style={styles.primaryButtonText}>Allow notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={skip} activeOpacity={0.9}>
          <Text style={styles.secondaryButtonText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  headerBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220,
  },
  header: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoBadge: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.darkPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  infoCard: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  benefits: {
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  benefitText: {
    marginLeft: 8,
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  previewCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconWrap: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    height: 28,
    width: 28,
  },
  previewTexts: {
    flex: 1,
    marginLeft: 10,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  previewBody: {
    marginTop: 2,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  previewTime: {
    marginLeft: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    width: WINDOW_WIDTH - 32,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    width: WINDOW_WIDTH - 32,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  finePrint: {
    marginTop: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 12,
  },
  bottomActions: {
    marginTop: 'auto',
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
});