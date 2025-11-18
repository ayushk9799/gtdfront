import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AudioAura({ isPlaying, size = 160, onPress, disabled = false }) {

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const waveLoopsRef = useRef([]);

  useEffect(() => {
    let rLoop = null;
    let pLoop = null;

    const start = () => {
      try { rotateAnim.setValue(0); } catch (_) {}
      try { pulseAnim.setValue(0); } catch (_) {}

      const r = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      const p = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      rLoop = r;
      pLoop = p;
      r.start();
      p.start();

      // Projecting longitudinal waves
      waveLoopsRef.current.forEach((loop) => {
        try { loop.stop?.(); } catch (_) {}
      });
      waveLoopsRef.current = [];
      waveAnims.forEach((av, idx) => {
        try { av.setValue(0); } catch (_) {}
        const seq = Animated.sequence([
          Animated.delay(idx * 600),
          Animated.timing(av, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(av, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]);
        const loop = Animated.loop(seq);
        waveLoopsRef.current.push(loop);
        loop.start();
      });
    };

    const stop = () => {
      try { rotateAnim.stopAnimation(); } catch (_) {}
      try { pulseAnim.stopAnimation(); } catch (_) {}
      waveLoopsRef.current.forEach((loop) => {
        try { loop.stop?.(); } catch (_) {}
      });
      waveLoopsRef.current = [];
      waveAnims.forEach((av) => {
        try { av.setValue(0); } catch (_) {}
      });
    };

    if (isPlaying) start();
    else stop();

    return () => {
      stop();
      try { rotateAnim.setValue(0); } catch (_) {}
      try { pulseAnim.setValue(0); } catch (_) {}
    };
  }, [isPlaying, rotateAnim, pulseAnim]);

  const rotateDeg = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] });

  const strokeMain = Colors.brand.darkPink;
  const strokeAlt = '#FB7185'; // soft rose

  return (
    <View pointerEvents="box-none" style={{ width: size, height: size }}>
      <AnimatedView
        style={[
          styles.centerWrap,
          {
            transform: isPlaying ? [{ rotate: rotateDeg }, { scale }] : [{ rotate: '0deg' }, { scale: 1 }],
            opacity: 1,
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="aura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={strokeAlt} stopOpacity="0.35" />
              <Stop offset="55%" stopColor={strokeMain} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={strokeMain} stopOpacity="0.05" />
            </RadialGradient>
          </Defs>

          {/* Projecting longitudinal waves */}
          <G>
            {waveAnims.map((av, idx) => (
              <AnimatedCircle
                key={`wave-${idx}`}
                cx={size / 2}
                cy={size / 2}
                r={av.interpolate({
                  inputRange: [0, 1],
                  outputRange: [size * 0.24, size * 0.56],
                })}
                stroke={strokeAlt}
                strokeWidth={av.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2.2, 0.6],
                })}
                strokeOpacity={av.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0, 0.8, 0],
                })}
                fill="none"
              />
            ))}
          </G>

          {/* Background aura and concentric rings */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.46}
            fill="url(#aura)"
          />

          <G>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size * 0.28}
              stroke={strokeMain}
              strokeWidth={2.2}
              strokeOpacity={0.5}
              fill="none"
              strokeDasharray="10 8"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size * 0.33}
              stroke={strokeAlt}
              strokeWidth={1.6}
              strokeOpacity={0.45}
              fill="none"
              strokeDasharray="6 12"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size * 0.40}
              stroke={strokeMain}
              strokeWidth={1.8}
              strokeOpacity={0.38}
              fill="none"
              strokeDasharray="2 10"
            />
          </G>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.10}
            fill={strokeMain}
            opacity={0.12}
          />
        </Svg>
      </AnimatedView>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled}
        style={styles.centerIconWrap}
      >
        <MaterialCommunityIcons
          name="microphone"
          size={Math.max(20, Math.floor(size * 0.38))}
          color={isPlaying ? '#ffffff' : Colors.brand.darkPink}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


