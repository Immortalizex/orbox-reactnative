import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuickStatCard from '../components/QuickStatCard';
import StatusBadge from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { data: boxes = [] } = useQuery({
    queryKey: ['adminBoxes'],
    queryFn: () => api.entities.Box.list('-created_date', 200),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.entities.Booking.list('-created_date', 500),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.entities.User.list('-created_date', 500),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['adminSupportTicketsCount'],
    queryFn: () => api.entities.SupportTicket.adminList({}, '-created_date', 500),
  });

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed' || b.status === 'active')
    .reduce((s, b) => s + (b.total_price || 0), 0);
  const activeBookings = bookings.filter((b) => b.status === 'active' || b.status === 'confirmed').length;
  const onlineBoxes = boxes.filter((b) => b.status === 'online').length;
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const recentBookings = bookings.slice(0, 8);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="grid" size={20} color="#F5A623" />
        <Text style={styles.title}>Dashboard Admin</Text>
      </View>

      <View style={styles.statsGrid}>
        <QuickStatCard iconName="cash" label="Receita Total" value={`R$ ${totalRevenue.toFixed(0)}`} accent />
        <QuickStatCard iconName="calendar" label="Reservas Ativas" value={activeBookings} />
        <QuickStatCard iconName="cube" label="Boxes Online" value={`${onlineBoxes}/${boxes.length}`} />
        <QuickStatCard iconName="people" label="Usuários" value={users.length} />
        <TouchableOpacity
          style={styles.ticketCard}
          onPress={() => navigation.navigate('AdminSupportTickets')}
          activeOpacity={0.8}
        >
          <View style={styles.ticketCardInner}>
            <View style={[styles.iconWrap, styles.iconWrapTicket]}>
              <Ionicons name="ticket" size={20} color="#F5A623" />
            </View>
            <View>
              <Text style={styles.ticketCardLabel}>Tickets de Suporte</Text>
              <Text style={styles.ticketCardValue}>{openTickets} abertos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Reservas Recentes</Text>
      <View style={styles.table}>
        {recentBookings.map((b) => (
          <View key={b.id} style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Usuário</Text>
              <Text style={styles.cellValue}>{b.user_name || b.user_email}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Box</Text>
              <Text style={styles.cellValue}>{b.box_name}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Data</Text>
              <Text style={styles.cellValue}>
                {b.date ? format(new Date(b.date), 'dd/MM', { locale: ptBR }) : '—'}
              </Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Valor</Text>
              <Text style={styles.cellValueAccent}>R$ {b.total_price?.toFixed(2)}</Text>
            </View>
            <StatusBadge status={b.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  ticketCard: {
    minWidth: '100%',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapTicket: { backgroundColor: 'rgba(245,166,35,0.15)' },
  ticketCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  ticketCardValue: { fontSize: 16, fontWeight: '700', color: '#F5A623' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  table: { backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  row: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12, alignItems: 'center' },
  cell: { minWidth: 80 },
  cellLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 },
  cellValue: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  cellValueAccent: { fontSize: 13, fontWeight: '600', color: '#F5A623' },
});
