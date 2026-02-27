import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuickStatCard({ icon, iconName, label, value, accent }) {
  const name = iconName || 'stats-chart';
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
        <Ionicons name={name} size={20} color={accent ? '#F5A623' : 'rgba(255,255,255,0.5)'} />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  cardAccent: {
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderColor: 'rgba(245,166,35,0.2)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapAccent: { backgroundColor: 'rgba(245,166,35,0.15)' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 20, fontWeight: '700', color: '#fff' },
  valueAccent: { color: '#F5A623' },
});
