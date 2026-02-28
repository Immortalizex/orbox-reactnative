import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExploreMapView() {
  return (
    <View style={styles.mapWrap}>
      <View style={[styles.map, styles.mapPlaceholder]}>
        <Text style={styles.mapPlaceholderText}>Mapa disponível no app (iOS/Android)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, minHeight: 400 },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' },
  mapPlaceholderText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
