import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, PermissionsAndroid, SafeAreaView, ScrollView } from 'react-native';
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
import { handleFCMTokenUpdate } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';

const storage = new MMKV();

export default function NotificationPermission() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const openGetReadyScreen = () => {
    const isNewUser = storage.getBoolean('isNewUser');
    if (isNewUser) {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Tabs' },
          { name: 'GetReadyForCase' },
        ],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    }
  };

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
    // Mark that the user has made a decision on notifications
    storage.set('notifDecided', true);

    // Request OS permission
    const granted = await requestUserPermission();
    storage.set('notifEnabled', granted);

    openGetReadyScreen();


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

      // Get user data from local storage and update FCM token only when enabled
      const userDataString = storage.getString('user');
      if (userDataString) {
        try {
          const userDataParsed = JSON.parse(userDataString);
          await handleFCMTokenUpdate(dispatch, userDataParsed);
        } catch (e) {
          console.warn('Failed to parse user data for FCM token update', e);
        }
      }
    }

  };

  const skip = () => {
    storage.set('notifDecided', true);
    storage.set('notifEnabled', false);
    openGetReadyScreen();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF3F7', '#FFFFFF', '#FFF8FA']}
        locations={[0, 0.56, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowSide} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.mainContent}>
          <View style={styles.hero}>
            <View style={styles.animationWrap}>
              <LottieView
                source={require('../../assets/bell.lottie')}
                autoPlay
                loop
                resizeMode="contain"
                style={styles.bellAnimation}
              />
              <View style={[styles.sparkle, styles.sparkleLeft]}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#FF8BA7" />
              </View>
              <View style={[styles.sparkle, styles.sparkleRight]}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#C2185B" />
              </View>
            </View>

            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {t('notification.title')}
            </Text>
            <Text style={styles.subtitle}>{t('notification.description')}</Text>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={proceed} activeOpacity={0.88}>
            <LinearGradient
              colors={['#F472B6', '#FB7185']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.primaryButtonText}>{t('notification.enable')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={skip} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>{t('notification.notNow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
  },
  glowTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -150,
    right: -70,
    backgroundColor: 'rgba(255,64,125,0.10)',
  },
  glowSide: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 210,
    left: -135,
    backgroundColor: 'rgba(194,24,91,0.05)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 16,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
  },
  animationWrap: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellAnimation: {
    width: 220,
    height: 220,
  },
  sparkle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#C2185B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sparkleLeft: {
    left: 10,
    top: 58,
  },
  sparkleRight: {
    right: 8,
    bottom: 48,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#172033',
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    lineHeight: 21,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomActions: {
    marginTop: 16,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: Colors.brand.darkPink,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
});
