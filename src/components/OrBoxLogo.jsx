import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function OrBoxIcon({ size = 32 }) {
  return (
    <View style={[styles.iconWrap, { width: size, height: size, borderRadius: Math.round(size / 4) }]}>
      <Text style={[styles.iconText, { fontSize: Math.max(10, Math.round(size * 0.52)) }]}>or</Text>
      <Text style={[styles.iconTextFit, { fontSize: Math.max(10, Math.round(size * 0.52)) }]}>F</Text>
    </View>
  );
}

export function OrBoxLogoFull({ height = 36 }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.wordmark, { fontSize: Math.max(14, Math.round(height * 0.62)) }]}>
        <Text style={styles.wordmarkRbox}>orb</Text>
        <Text style={styles.wordmarkO}>o</Text>
        <Text style={styles.wordmarkRbox}>x</Text>
        <Text style={styles.wordmarkFit}>Fit</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wordmark: { fontWeight: '800', letterSpacing: 0.2 },
  wordmarkO: { color: '#f7941d' },
  wordmarkRbox: { color: '#FFFFFF' },
  wordmarkFit: { color: '#22c55e' },
  iconWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0,
  },
  iconText: { color: '#FFFFFF', fontWeight: '800' },
  iconTextFit: { color: '#22c55e', fontWeight: '900' },
});

export default OrBoxIcon;
