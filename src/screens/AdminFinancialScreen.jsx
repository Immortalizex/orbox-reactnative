import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import QuickStatCard from '../components/QuickStatCard';

export default function AdminFinancialScreen() {
  const { data: bookings = [] } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.entities.Booking.list('-date', 500),
  });

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed' || b.status === 'active')
    .reduce((s, b) => s + (b.total_price || 0), 0);
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const avgTicket = completedCount > 0
    ? bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.total_price || 0), 0) / completedCount
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Financeiro</Text>
      <View style={styles.statsGrid}>
        <QuickStatCard iconName="cash" label="Receita Total" value={`R$ ${totalRevenue.toFixed(0)}`} accent />
        <QuickStatCard iconName="document-text" label="Reservas Concluídas" value={completedCount} />
        <QuickStatCard iconName="stats-chart" label="Ticket Médio" value={`R$ ${avgTicket.toFixed(0)}`} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
