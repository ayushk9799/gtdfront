import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, useColorScheme, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import doctorsilhoute from '../../constants/doctorsilhoute3.png';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const themeColors =  Colors.light;
  const navigation = useNavigation();
  const [showCTA, setShowCTA] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [optionLines, setOptionLines] = useState([]);
  const fade = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const optionOpacities = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const script = useMemo(() => ([
    { type: 'line', text: 'You are a doctor.', duration: 1200, pause: 400, flicker: false },
    { type: 'line', text: 'A patient walks in — pale, sweating, clutching his chest.', duration: 1800, pause: 400 },
    { type: 'line', text: 'He’s 42. His pulse is weak. His ECG monitor screams for help.', duration: 2000, pause: 400 },
    { type: 'line', text: 'You have seconds.', duration: 1000, pause: 600, flicker: true },
    { type: 'options', lines: ['What will you do first?', 'Call for an ECG?', 'Order Troponin?', 'Ask for history?', 'Wait and observe?'], hold: 2200 },
    { type: 'line', text: 'Every choice matters.', duration: 1200, pause: 300 },
    { type: 'line', text: 'Can you save him?', duration: 1400, pause: 600 },
    { type: 'cta' },
  ]), []);

  function run(animation) {
    return new Promise(resolve => animation.start(() => resolve(undefined)));
  }

  useEffect(() => {
    let isMounted = true;
    async function play() {
      for (let i = 0; i < script.length && isMounted; i++) {
        const step = script[i];
        if (step.type === 'line') {
          setOptionLines([]);
          optionOpacities.forEach(v => v.setValue(0));
          setCurrentLine(step.text);
          fade.setValue(0);
          await run(Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
          if (step.flicker) {
            flicker.setValue(0);
            await run(Animated.sequence([
              Animated.timing(flicker, { toValue: 1, duration: 60, useNativeDriver: true }),
              Animated.timing(flicker, { toValue: 0, duration: 120, useNativeDriver: true }),
            ]));
          }
          await run(Animated.delay(step.duration));
          await run(Animated.timing(fade, { toValue: 0, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }));
          await run(Animated.delay(step.pause || 0));
        } else if (step.type === 'options') {
          setCurrentLine(step.lines[0]);
          setOptionLines(step.lines.slice(1));
          fade.setValue(0);
          optionOpacities.forEach(v => v.setValue(0));
          await run(Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
          // Reveal options one by one
          for (let j = 0; j < step.lines.slice(1).length; j++) {
            await run(Animated.timing(optionOpacities[j], { toValue: 1, duration: 300, useNativeDriver: true }));
            await run(Animated.delay(120));
          }
          await run(Animated.delay(step.hold || 1600));
          // Fade all out
          await run(Animated.parallel([
            Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
            ...step.lines.slice(1).map((_, idx) => Animated.timing(optionOpacities[idx], { toValue: 0, duration: 250, useNativeDriver: true })),
          ]));
        } else if (step.type === 'cta') {
          setShowCTA(true);
        }
      }
    }
    play();
    return () => { isMounted = false; };
  }, [fade, flicker, optionOpacities, script]);

  useEffect(() => {
    if (!showCTA) {
      try { shimmerAnim.stopAnimation?.(); } catch (_) {}
      shimmerAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => { try { loop.stop?.(); } catch (_) {} shimmerAnim.setValue(0); };
  }, [showCTA, shimmerAnim]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top','left','right']}>
      <View style={{ flex: 1 }}>
        <View style={{ height: '58%', width: '100%' }}>
          <ImageBackground
            source={doctorsilhoute}
            resizeMode="cover"
            style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}
          >
            <LinearGradient
              colors={[ 'rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', '#ffffff' ]}
              style={{ width: '100%', height: 160 }}
              pointerEvents="none"
            />
          </ImageBackground>
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'flex-start', alignItems: 'center' }}>
          <View style={{ position: 'absolute', right: 20, top: 8 }}>
            <TouchableOpacity onPress={() => navigation.replace('Login')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Text style={{ color: '#6B7280', fontWeight: '700' }}>Skip</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%', maxWidth: 640, minHeight: 180, alignItems: 'center', marginTop: 6 }}>
            <Animated.Text
              style={{
                fontSize: 32,
                fontWeight: '800',
                color: themeColors.text,
                textAlign: 'center',
                lineHeight: 40,
                opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
              }}
            >
              {currentLine}
            </Animated.Text>

            {optionLines.length > 0 && (
              <View style={{ marginTop: 10, alignItems: 'center' }}>
                {optionLines.map((line, idx) => {
                const textLower = (line || '').toLowerCase();
                let color = '#374151';
                let bg = 'transparent';
                let icon = null;
                if (textLower.includes('ecg') || textLower.includes('troponin')) {
                  color = '#166534';
                  bg = 'rgba(22, 165, 52, 0.10)';
                  icon = 'check-circle-outline';
                } else if (textLower.includes('wait')) {
                  color = '#991B1B';
                  bg = 'rgba(220, 38, 38, 0.10)';
                  icon = 'alert-circle-outline';
                }
                return (
                  <Animated.View key={idx} style={{
                    opacity: optionOpacities[idx],
                    marginTop: idx === 0 ? 12 : 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: bg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'center',
                  }}>
                    {icon && (
                      <MaterialCommunityIcons name={icon} size={18} color={color} />
                    )}
                    <Text style={{
                      marginLeft: icon ? 8 : 0,
                      fontSize: 18,
                      color,
                      textAlign: 'center',
                    }}>
                      {line}
                    </Text>
                  </Animated.View>
                  );
                })}
              </View>
            )}
          </View>

          {showCTA && (
            <>
              <TouchableOpacity
                onPress={() => navigation.replace('Login')}
                activeOpacity={0.9}
                style={{
                  marginTop: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  minHeight: 60,
                  borderRadius: 999,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  alignSelf: 'stretch',
                }}
              >
                <LinearGradient
                  colors={["#F472B6", "#FB7185"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 999 }}
                />
                <Animated.View
                  pointerEvents="none"
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 120, opacity: 0.8, transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [0,1], outputRange: [-100, 220] }) }] }}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                  />
                </Animated.View>
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 18 }}>Tap to begin your first case</Text>
              </TouchableOpacity>
              <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center' }}>
                Every choice matters.
              </Text>
            </>
          )}

        
        </View>
      </View>
    </SafeAreaView>
  );
}


