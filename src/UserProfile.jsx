import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function UserProfile() {
  const route = useRoute();
  const { user } = route.params || {};

  const name  = user?.user?.name  || 'Anonymous';
  const photo = user?.user?.photo;

  return (
    <View style={styles.container}>
      {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : null}
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar:    { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  name:      { fontSize: 20, fontWeight: 'bold' },
});