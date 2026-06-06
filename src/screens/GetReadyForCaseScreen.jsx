import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MMKV } from 'react-native-mmkv';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../constants/Api';
import { Colors } from '../../constants/Colors';
import loginDoctor from '../../constants/logindoctor.png';
import { clearCurrentGame, loadCaseById } from '../store/slices/currentGameSlice';

const storage = new MMKV();
const CASE_CARDS = [
  {
    key: 'story',
    icon: 'clipboard-text-outline',
    titleKey: 'getReady.cardStoryTitle',
    title: 'Read patient story',
    descKey: 'getReady.cardStoryDesc',
    desc: 'Review history, symptoms and vital signs.',
  },
  {
    key: 'tests',
    icon: 'test-tube',
    titleKey: 'getReady.cardTestsTitle',
    title: 'Order key tests',
    descKey: 'getReady.cardTestsDesc',
    desc: 'Select the right tests to narrow down possibilities.',
  },
  {
    key: 'diagnosis',
    icon: 'brain',
    titleKey: 'getReady.cardDiagnosisTitle',
    title: 'Make your diagnosis',
    descKey: 'getReady.cardDiagnosisDesc',
    desc: 'Analyze results and choose your final diagnosis.',
  },
];

export default function GetReadyForCaseScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { height } = useWindowDimensions();
  const isCompact = height < 760;

  const handleStartCase = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const userDataString = storage.getString('user');
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const userId = userData?.userId || userData?._id || userData?.id;
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`${API_BASE}/api/cases/first${query}`);
      const data = await res.json();
      const firstCaseId = data?.case?.id;

      if (!res.ok || !firstCaseId) {
        throw new Error(data?.error || 'First case not found');
      }

      dispatch(clearCurrentGame());
      await dispatch(loadCaseById(firstCaseId)).unwrap();
      navigation.replace('ClinicalInfo');
    } catch (e) {
      console.warn('Failed to start first case', e);
      navigation.replace('Tabs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF8FB', '#FFF0F6', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image source={loginDoctor} style={styles.backgroundImage} />
      <LinearGradient
        colors={[
          'rgba(255,248,251,0.0)',
          'rgba(255,248,251,0.15)',
          'rgba(255,255,255,0.75)',
          '#FFFFFF',
        ]}
        locations={[0, 0.4, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <Text style={styles.title}>
          {t('getReady.title', { defaultValue: 'Ready for your first case?' })}
        </Text>
        <Text style={styles.subtitle}>
          {t('getReady.subtitle', {
            defaultValue: 'Meet the patient, choose tests, diagnose, then learn from feedback.',
          })}
        </Text>

        <View style={styles.cardList}>
          {CASE_CARDS.map(card => (
            <View key={card.key} style={styles.infoCard}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons name={card.icon} size={22} color={Colors.brand.darkPink} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>
                  {t(card.titleKey, { defaultValue: card.title })}
                </Text>
                <Text style={styles.cardDesc}>
                  {t(card.descKey, { defaultValue: card.desc })}
                </Text>
              </View>

            </View>
          ))}
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonLoading]}
          onPress={handleStartCase}
          activeOpacity={0.9}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF407D', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.buttonGlow} />
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.primaryButtonInner}>
              <Text style={styles.primaryButtonText}>
                {t('getReady.startCase', { defaultValue: 'Start case' })}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={21} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {!loading && (
          <TouchableOpacity
            style={styles.laterButton}
            onPress={() => navigation.replace('Tabs')}
            activeOpacity={0.7}
          >
            <Text style={styles.laterButtonText}>
              {t('getReady.maybeLater', { defaultValue: 'Maybe later' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
    opacity: 0.42,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  contentCompact: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    color: '#11181C',
    textAlign: 'center',
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  cardList: {
    marginTop: 22,
  },
  infoCard: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  cardTitle: {
    color: '#11181C',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  cardDesc: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.darkPink,
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },
  primaryButtonLoading: {
    opacity: 0.8,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 9,
  },
  laterButton: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  laterButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },
});
