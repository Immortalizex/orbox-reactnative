import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '../components/StatusBadge';

export default function AdminBookingsScreen() {
  const { data: bookings = [] } = useQuery({
    queryKey: ['adminAllBookings'],
    queryFn: () => api.entities.Booking.list('-date', 500),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gestão de Reservas</Text>
      {bookings.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.user}>{b.user_name || b.user_email}</Text>
          <Text style={styles.box}>{b.box_name}</Text>
          <Text style={styles.meta}>
            {b.date ? format(new Date(b.date), 'dd/MM', { locale: ptBR }) : '—'} · {b.start_time} - {b.end_time}
          </Text>
          <View style={styles.row}>
            <Text style={styles.price}>R$ {b.total_price?.toFixed(2)}</Text>
            <StatusBadge status={b.status} />
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
  user: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  box: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '700', color: '#F5A623' },
});
