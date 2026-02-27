import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ icon, iconName, title, description, action }) {
  const name = iconName || (typeof icon === 'string' ? icon : 'ellipse');
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={name} size={36} color="rgba(255,255,255,0.15)" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  description: { color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginBottom: 24, maxWidth: 320 },
  action: {},
});
