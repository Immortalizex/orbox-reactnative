import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function AdminPersonaisScreen() {
  const { data: personais = [] } = useQuery({
    queryKey: ['adminPersonais'],
    queryFn: () => api.entities.Personal.list('-created_date', 200),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Personais</Text>
      {personais.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.full_name}</Text>
          <Text style={styles.meta}>CREF: {p.cref || '—'} · R$ {p.price_per_session?.toFixed(2)}/sessão</Text>
          <View style={styles.statusWrap}>
            <Text style={[styles.status, p.status === 'active' && styles.statusActive]}>
              {p.status === 'pending' ? 'Em análise' : p.status === 'active' ? 'Ativo' : 'Suspenso'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
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
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  statusWrap: {},
  status: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  statusActive: { color: '#4ade80' },
});
