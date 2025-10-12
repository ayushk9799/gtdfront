import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/Colors';

export default function DecorativeSeparator({ iconSize = 16, color = Colors.brand.darkPink, style }) {
  return (
    <View style={[styles.separatorRow, style]}>
      <LinearGradient
        colors={["transparent", "rgba(255,64,125,0.35)", color]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.separatorLine}
      />
      <Feather name="activity" size={iconSize} color={color} />
      <LinearGradient
        colors={[color, "rgba(255,64,125,0.35)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.separatorLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  separatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6 },
  separatorLine: { flex: 1, height: 2, borderRadius: 2 },
});


