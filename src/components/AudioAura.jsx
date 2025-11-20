import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  useAnimatedProps,
  interpolate,
  Extrapolation,
  Easing as ReEasing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AudioAuraImpl({ size = 160, onPress, disabled = false }, ref) {

  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0);
  const wave = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const [active, setActive] = useState(false);
  const onPressRef = useRef(onPress);
  useEffect(() => { onPressRef.current = onPress; }, [onPress]);

  const start = () => {
    rotate.value = 0;
    pulse.value = 0;
    rotate.value = withRepeat(
      withTiming(1, { duration: 9000, easing: ReEasing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: ReEasing.inOut(ReEasing.sin) }),
        withTiming(0, { duration: 1600, easing: ReEasing.inOut(ReEasing.sin) }),
      ),
      -1,
      false
    );
    wave.forEach((w, idx) => {
      w.value = 0;
      w.value = withRepeat(
        withSequence(
          withDelay(idx * 600, withTiming(1, { duration: 2600, easing: ReEasing.out(ReEasing.quad) })),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    });
    setActive(true);
  };

  const stop = () => {
    cancelAnimation(rotate);
    cancelAnimation(pulse);
    wave.forEach((w) => cancelAnimation(w));
    rotate.value = 0;
    pulse.value = 0;
    wave.forEach((w) => { w.value = 0; });
    setActive(false);
  };

  useImperativeHandle(ref, () => ({
    start,
    stop,
  }), []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const animatedWrapStyle = useAnimatedStyle(() => {
    const scaleVal = 0.96 + (1.08 - 0.96) * pulse.value;
    const rotateDeg = `${rotate.value * 360}deg`;
    return {
      transform: [{ rotate: rotateDeg }, { scale: scaleVal }],
      opacity: 1,
    };
  }, []);

  const strokeMain = Colors.brand.darkPink;
  const strokeAlt = '#FB7185'; // soft rose

  const waveAnimatedProps = wave.map((w) =>
    useAnimatedProps(() => {
      const r = size * 0.24 + (size * 0.56 - size * 0.24) * w.value;
      const sw = 2.2 + (0.6 - 2.2) * w.value;
      const v = w.value;
      const opacity = v <= 0.2
        ? (v / 0.2) * 0.8
        : 0.8 * (1 - (v - 0.2) / 0.8);
      return { r, strokeWidth: sw, strokeOpacity: opacity };
    })
  );

  return (
    <View pointerEvents="box-none" style={{ width: size, height: size }}>
      <Animated.View style={[styles.centerWrap, active ? animatedWrapStyle : null]}>
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
            {waveAnimatedProps.map((animatedProps, idx) => (
              <AnimatedCircle
                key={`wave-${idx}`}
                cx={size / 2}
                cy={size / 2}
                animatedProps={animatedProps}
                stroke={strokeAlt}
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
      </Animated.View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPressRef.current?.()}
        disabled={disabled}
        style={styles.centerIconWrap}
      >
        <MaterialCommunityIcons
          name="microphone"
          size={Math.max(20, Math.floor(size * 0.38))}
          color={active ? '#ffffff' : Colors.brand.darkPink}
        />
      </TouchableOpacity>
    </View>
  );
}

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled
  );
};

const AudioAura = React.memo(forwardRef(AudioAuraImpl), arePropsEqual);
export default AudioAura;

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


