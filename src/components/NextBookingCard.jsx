import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NextBookingCard({ booking, onFindBox, onViewDetails }) {
  if (!booking) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="flash" size={28} color="rgba(255,255,255,0.2)" />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma reserva próxima</Text>
        <TouchableOpacity onPress={onFindBox}>
          <Text style={styles.emptyLink}>Encontrar um box →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const bookingDate = new Date(booking.date);
  const isToday = format(new Date(), 'yyyy-MM-dd') === booking.date;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.badge, isToday && styles.badgeToday]}>
          <Text style={[styles.badgeText, isToday && styles.badgeTextToday]}>
            {isToday ? 'Hoje' : format(bookingDate, 'dd MMM', { locale: ptBR })}
          </Text>
        </View>
        <View style={[styles.badge, booking.status === 'active' ? styles.badgeActive : styles.badgeConfirmed]}>
          <Text style={styles.badgeTextStatus}>
            {booking.status === 'active' ? 'Em andamento' : 'Confirmada'}
          </Text>
        </View>
      </View>
      <Text style={styles.boxName}>{booking.box_name}</Text>
      <Text style={styles.time}>
        {booking.start_time} — {booking.end_time}
      </Text>
      <TouchableOpacity style={styles.cta} onPress={onViewDetails}>
        <Text style={styles.ctaText}>
          {booking.status === 'active' ? 'Controlar Box' : 'Ver Detalhes'}
        </Text>
        <Ionicons name="arrow-forward" size={16} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 8 },
  emptyLink: { color: '#F5A623', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(245,166,35,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    borderRadius: 16,
    padding: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeToday: { backgroundColor: '#F5A623' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  badgeTextToday: { color: '#000' },
  badgeActive: { backgroundColor: 'rgba(34,197,94,0.2)' },
  badgeConfirmed: { backgroundColor: 'rgba(59,130,246,0.2)' },
  badgeTextStatus: { color: '#fff', fontSize: 12, fontWeight: '500' },
  boxName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  time: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ctaText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
