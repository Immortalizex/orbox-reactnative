import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '../components/StatusBadge';
import QuickStatCard from '../components/QuickStatCard';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['history', user?.email],
    queryFn: () => api.entities.Booking.filter({ user_email: user?.email }, '-date', 200),
    enabled: !!user?.email,
  });

  const completed = bookings.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((s, b) => s + (b.total_price || 0), 0);
  const totalHours = completed.reduce((sum, b) => {
    const [sh, sm] = (b.start_time || '0:0').split(':').map(Number);
    const [eh, em] = (b.end_time || '0:0').split(':').map(Number);
    return sum + (eh + em / 60 - (sh + sm / 60));
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Histórico</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <QuickStatCard iconName="barbell" label="Sessões" value={completed.length} accent />
          <QuickStatCard iconName="time" label="Horas" value={`${totalHours.toFixed(0)}h`} />
        </View>
        <View style={[styles.statsRow, styles.statsRowLast]}>
          <QuickStatCard iconName="card" label="Total Gasto" value={`R$ ${totalSpent.toFixed(0)}`} />
          <QuickStatCard
            iconName="trending-up"
            label="Média/Sessão"
            value={completed.length > 0 ? `R$ ${(totalSpent / completed.length).toFixed(0)}` : 'R$ 0'}
          />
        </View>
      </View>

      {bookings.length === 0 ? (
        <EmptyState
          iconName="time"
          title="Sem histórico"
          description="Suas reservas aparecerão aqui após concluídas"
        />
      ) : (
        <View style={styles.list}>
          {bookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.boxName}>{booking.box_name}</Text>
                  <StatusBadge status={booking.status} />
                </View>
                <Text style={styles.meta}>
                  {format(new Date(booking.date), 'dd MMM yyyy', { locale: ptBR })} ·{' '}
                  {booking.start_time} — {booking.end_time}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.price}>R$ {booking.total_price?.toFixed(2)}</Text>
                <Text style={styles.payment}>
                  {booking.payment_method === 'credit_card'
                    ? 'Cartão'
                    : booking.payment_method === 'pix'
                    ? 'PIX'
                    : 'Créditos'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  statsGrid: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statsRowLast: { marginBottom: 0 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  cardLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  boxName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  meta: { fontSize: 12, color: '#fff' },
  cardRight: { alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '700', color: '#f7941d' },
  payment: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
