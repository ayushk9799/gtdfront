import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import loginDoctor from '../../constants/logindoctor.png';

const CASE_STEPS = [
  {
    key: 'story',
    titleKey: 'getReady.cardStoryTitle',
    title: 'Meet the patient',
    descKey: 'getReady.cardStoryDesc',
    desc: 'Review key patient information in order:',
    subsections: [
      { key: 'complaint', labelKey: 'getReady.subsectionComplaint', label: 'Patient complaint' },
      { key: 'vitals', labelKey: 'getReady.subsectionVitals', label: 'Vitals' },
      { key: 'symptoms', labelKey: 'getReady.subsectionSymptoms', label: 'Symptoms' },
      { key: 'history', labelKey: 'getReady.subsectionHistory', label: 'History' },
    ],
  },
  {
    key: 'tests',
    titleKey: 'getReady.cardTestsTitle',
    title: 'Order key tests',
    descKey: 'getReady.cardTestsDesc',
    desc: 'Narrow down the possibilities.',
  },
  {
    key: 'diagnosis',
    titleKey: 'getReady.cardDiagnosisTitle',
    title: 'Make your diagnosis',
    descKey: 'getReady.cardDiagnosisDesc',
    desc: 'Choose the most likely condition.',
  },
  {
    key: 'treatment',
    titleKey: 'getReady.cardTreatmentTitle',
    title: 'Choose treatment',
    descKey: 'getReady.cardTreatmentDesc',
    desc: 'Build the right treatment plan.',
  },
  {
    key: 'insights',
    titleKey: 'getReady.cardInsightsTitle',
    title: 'Review clinical insights',
    descKey: 'getReady.cardInsightsDesc',
    desc: 'Learn from detailed feedback.',
  },
];

export default function GetReadyForCaseScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const isCompact = height < 760;
  const heroAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimations = useRef(CASE_STEPS.map(() => new Animated.Value(0))).current;
  const footerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let entranceAnimation;

    const startEntranceAnimation = async () => {
      let reduceMotion = false;
      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch { }
      if (cancelled) return;

      if (reduceMotion) {
        heroAnimation.setValue(1);
        stepAnimations.forEach(animation => animation.setValue(1));
        footerAnimation.setValue(1);
        return;
      }

      entranceAnimation = Animated.sequence([
        Animated.timing(heroAnimation, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.sequence(
          stepAnimations.map(animation =>
            Animated.timing(animation, {
              toValue: 1,
              duration: 170,
              useNativeDriver: true,
            })
          )
        ),
        Animated.timing(footerAnimation, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);

      entranceAnimation.start();
    };

    startEntranceAnimation();

    return () => {
      cancelled = true;
      entranceAnimation?.stop();
    };
  }, [footerAnimation, heroAnimation, stepAnimations]);

  const heroAnimatedStyle = {
    opacity: heroAnimation,
    transform: [
      {
        translateY: heroAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
      {
        scale: heroAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };
  const footerAnimatedStyle = {
    opacity: footerAnimation,
    transform: [
      {
        translateY: footerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const handleContinue = () => {
    navigation.replace('Tabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF7FA', '#FFFFFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <View style={styles.heroImageWrap}>
            <Image source={loginDoctor} style={styles.heroImage} />
            <LinearGradient
              colors={['rgba(255,247,250,0.05)', 'rgba(255,247,250,0.35)', '#FFF9FB']}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.title, styles.heroTitle]}>
              {t('getReady.title', { defaultValue: 'Here’s how it works' })}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.subtitle}>
              {t('getReady.subtitle', {
                defaultValue: 'Explore each step of solving a clinical case.',
              })}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.timeline}>
          {CASE_STEPS.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === CASE_STEPS.length - 1;

            const stepAnimatedStyle = {
              opacity: stepAnimations[index],
              transform: [
                {
                  translateY: stepAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            };

            return (
              <Animated.View key={step.key} style={[styles.stepRow, stepAnimatedStyle]}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepNumber, isFirst && styles.stepNumberActive]}>
                    <Text style={[styles.stepNumberText, isFirst && styles.stepNumberTextActive]}>
                      {index + 1}
                    </Text>
                  </View>
                  {!isLast && <View style={styles.stepLine} />}
                </View>
                <View style={[styles.stepContent, isFirst && styles.stepContentActive]}>
                  <Text style={styles.stepTitle}>
                    {t(step.titleKey, { defaultValue: step.title })}
                  </Text>
                  <Text style={styles.stepDesc}>
                    {t(step.descKey, { defaultValue: step.desc })}
                  </Text>
                  {step.subsections && (
                    <View style={styles.subsectionList}>
                      {step.subsections.map((subsection, subsectionIndex) => (
                        <View key={subsection.key} style={styles.subsectionRow}>
                          <View style={styles.subsectionNumber}>
                            <Text style={styles.subsectionNumberText}>{subsectionIndex + 1}</Text>
                          </View>
                          <Text style={styles.subsectionText}>
                            {t(subsection.labelKey, { defaultValue: subsection.label })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF407D', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.buttonGlow} />
          <View style={styles.primaryButtonInner}>
            <Text style={styles.primaryButtonText}>
              {t('getReady.continue', { defaultValue: 'Continue' })}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={21} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 18,
  },
  contentCompact: {
    paddingTop: 0,
  },
  hero: {
    alignItems: 'center',
  },
  heroImageWrap: {
    alignSelf: 'stretch',
    height: 245,
    marginHorizontal: -24,
    marginTop: -8,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroCopy: {
    marginTop: -10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    color: '#172033',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroTitle: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  timeline: {
    marginTop: 17,
    paddingHorizontal: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stepRail: {
    width: 36,
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE3EC',
  },
  stepNumberActive: {
    backgroundColor: Colors.brand.darkPink,
    borderColor: Colors.brand.darkPink,
    shadowColor: Colors.brand.darkPink,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  stepNumberText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 24,
    backgroundColor: '#E7EAF0',
  },
  stepContent: {
    flex: 1,
    marginLeft: 13,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 17,
    borderRadius: 13,
  },
  stepContentActive: {
    marginBottom: 8,
    paddingTop: 9,
    paddingBottom: 9,
    backgroundColor: '#FFF3F7',
    borderWidth: 1,
    borderColor: '#FFE0EA',
  },
  stepTitle: {
    color: '#172033',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  stepDesc: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  subsectionList: {
    marginTop: 9,
  },
  subsectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  subsectionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1DF',
  },
  subsectionNumberText: {
    color: Colors.brand.darkPink,
    fontSize: 10,
    fontWeight: '900',
  },
  subsectionText: {
    marginLeft: 8,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF1F5',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
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
});
