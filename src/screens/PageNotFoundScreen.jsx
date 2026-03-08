import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PageNotFoundScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
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
  code: { fontSize: 64, color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  title: { fontSize: 20, color: '#fff', marginBottom: 24 },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
