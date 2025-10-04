import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Account() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Manage your profile and settings here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, opacity: 0.7, textAlign: 'center', paddingHorizontal: 24 },
});


