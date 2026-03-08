import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UserNotRegisteredScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          You are not registered to use this application. Please contact the app administrator to request access.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  message: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
});
