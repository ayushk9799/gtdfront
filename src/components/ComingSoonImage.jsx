import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

export default function ComingSoonImage({ style, title = 'Images coming soon' }) {
  return (
    <View style={[styles.container, style]}>
      {/* 1. Metallic/Silver Backing (The Mirror Surface) */}
      <LinearGradient
        colors={['#9DAAB3', '#E2E8F0', '#B0BCC5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. The Fog Layer (Cloudy/Steamy overlay) */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.4)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 3. Glass Sheen/Reflection (Diagonal highlight) */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.sheen}
        pointerEvents="none"
      />

      <View style={styles.overlay}>
        {/* Glass Pill wrapping the text */}
        <View style={styles.pillContainer}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor="white"
          />
          <Text style={styles.text}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.8,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pillContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Platform.select({
      ios: 'rgba(255,255,255,0.3)',
      android: 'rgba(255,255,255,0.6)' // Android blur fallback/enhancement
    }),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: '#546E7A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
