import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function AdminBoxesScreen() {
  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ['adminBoxes'],
    queryFn: () => api.entities.Box.list('-created_date', 200),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gestão de Boxes</Text>
      {boxes.map((box) => (
        <View key={box.id} style={styles.card}>
          <Text style={styles.name}>{box.name}</Text>
          <Text style={styles.address}>{box.address}</Text>
          <View style={styles.row}>
            <StatusBadge status={box.status} />
            <Text style={styles.price}>R$ {box.price_per_hour?.toFixed(2)}/h</Text>
          </View>
        </View>
      ))}
      {boxes.length === 0 && !isLoading && (
        <Text style={styles.empty}>Nenhum box cadastrado</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  address: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { fontSize: 14, fontWeight: '700', color: '#f7941d' },
  empty: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingVertical: 24 },
});
