import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Things() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Things</Text>
      <Text style={styles.subtitle}>Your items and progress will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7, textAlign: 'center', paddingHorizontal: 24 },
});


