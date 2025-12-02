import React, { useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

function AudioAuraImpl({ size = 160, onPress, disabled = false }, ref) {
  const [isPlaying, setIsPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    start: () => setIsPlaying(true),
    stop: () => setIsPlaying(false),
  }), []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            backgroundColor: isPlaying ? Colors.brand.darkPink : '#E5E7EB',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={isPlaying ? 'volume-high' : 'volume-off'}
          size={Math.max(20, Math.floor(size * 0.32))}
          color={isPlaying ? '#fff' : '#9CA3AF'}
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
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
