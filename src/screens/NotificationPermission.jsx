import React, {  useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, PermissionsAndroid } from 'react-native';
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

const storage = new MMKV();
const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function NotificationPermission() {
  const navigation = useNavigation();
  const themeColors = Colors.light;
  const [enableReminders, setEnableReminders] = useState(true);
  const dispatch = useDispatch();

  const cardActiveStyle = useMemo(() => ({ borderColor: Colors.brand.darkPink, backgroundColor: '#FFF7F0' }), []);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consistency Builds{"\n"}Clinical Confidence</Text>
      <Text style={styles.subtitle}>A daily reminder can help you stay sharp.</Text>

      <View style={[styles.card, enableReminders && cardActiveStyle]}> 
        <View style={styles.badge}><Text style={styles.badgeText}>STRONGLY ADVISED</Text></View>
        <TouchableOpacity onPress={() => setEnableReminders(true)} activeOpacity={0.9} style={styles.cardInner}>
          <Text style={styles.cardIcon}>🔔❤️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Remind Me</Text>
            <Text style={styles.cardDesc}>Help me build my habit and stay on track.</Text>
          </View>
          <View style={[styles.radio, enableReminders && styles.radioOn]} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, !enableReminders && { borderColor: themeColors.border, backgroundColor: '#ffffff' }]}> 
        <TouchableOpacity onPress={() => setEnableReminders(false)} activeOpacity={0.9} style={styles.cardInner}>
          <Text style={[styles.cardIcon, { opacity: 0.5 }]}>🔕</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>I'll Set My Own Pace</Text>
            <Text style={styles.cardDesc}>I'll manage reminders on my own (for now!).</Text>
          </View>
          <View style={[styles.radio, !enableReminders && styles.radioOn]} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.helperText}>Build your habit, one daily case at a time — we'll help you stay consistent.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={proceed} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Let's GO →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#4B5563',
    fontWeight: '700',
  },
  card: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.darkPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -10,
    marginLeft: 16,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  cardDesc: {
    marginTop: 4,
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  radio: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginLeft: 12,
  },
  radioOn: {
    backgroundColor: Colors.brand.darkPink,
    borderColor: Colors.brand.darkPink,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    alignItems: 'center',
  },
  helperText: {
    textAlign: 'center',
    color: '#4B5563',
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    width: WINDOW_WIDTH - 48,
    backgroundColor: Colors.brand.darkPink,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
});