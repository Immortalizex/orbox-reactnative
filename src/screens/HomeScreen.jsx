import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, parse } from 'date-fns';
import QuickStatCard from '../components/QuickStatCard';
import NextBookingCard from '../components/NextBookingCard';
import ActiveSessionCard from '../components/ActiveSessionCard';
import BoxCard from '../components/BoxCard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const navigation = useNavigation();
  const rootNav = useRootNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: bookingsData } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const u = await api.auth.me();
      return api.entities.Booking.filter({ user_email: u.email }, '-date', 50);
    },
  });
  const bookings = Array.isArray(bookingsData) ? bookingsData : [];

  const { data: boxesData } = useQuery({
    queryKey: ['boxes'],
    queryFn: () => api.entities.Box.filter({ status: 'online' }, '-created_date', 6),
  });
  const boxes = Array.isArray(boxesData) ? boxesData : [];

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();
  const upcoming = bookings.filter(
    (b) => (b.status === 'confirmed' || b.status === 'active') && b.date >= today
  );
  const activeSession = bookings.find((b) => {
    if ((b.status !== 'confirmed' && b.status !== 'active') || b.date !== today) return false;
    const startDt = parse(`${b.date} ${b.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDt = parse(`${b.date} ${b.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    return now >= startDt && now <= endDt;
  });
  const nextBooking = upcoming
    .filter((b) => b.id !== activeSession?.id)
    .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`))[0];
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const totalHours = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => {
      const [sh, sm] = (b.start_time || '0:0').split(':').map(Number);
      const [eh, em] = (b.end_time || '0:0').split(':').map(Number);
      return sum + (eh + em / 60 - (sh + sm / 60));
    }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Bem-vindo de volta</Text>
      <Text style={styles.greeting}>
        Olá, <Text style={styles.greetingAccent}>{user?.full_name?.split(' ')[0] || '...'}</Text>
      </Text>

      <View style={styles.statsGrid}>
        <QuickStatCard iconName="calendar" label="Próximas" value={upcoming.length} accent />
        <QuickStatCard iconName="flash" label="Concluídas" value={completedCount} />
        <QuickStatCard iconName="time" label="Horas Treino" value={`${totalHours.toFixed(0)}h`} />
        <QuickStatCard iconName="location" label="Boxes Ativos" value={boxes.length} />
      </View>

      {activeSession && (
        <View style={styles.section}>
          <ActiveSessionCard
            booking={activeSession}
            onOpenSession={() =>
              rootNav.navigate('BoxSession', { bookingId: activeSession.id })
            }
          />
        </View>
      )}

      {!activeSession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próxima Sessão</Text>
          <NextBookingCard
            booking={nextBooking}
            onFindBox={() => navigation.navigate('ExploreMap')}
            onViewDetails={() => {
              if (nextBooking?.status === 'active') {
                rootNav.navigate('BoxSession', { bookingId: nextBooking.id });
              } else {
                navigation.navigate('MyBookings');
              }
            }}
          />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Boxes Disponíveis</Text>
          <TouchableOpacity onPress={() => rootNav.navigate('ExploreMap')}>
            <Text style={styles.link}>Ver todos →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.boxGrid}>
          {boxes.slice(0, 6).map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              onPress={() => rootNav.navigate('BookBox', { boxId: box.id })}
            />
          ))}
        </View>
        {boxes.length === 0 && (
          <Text style={styles.emptyText}>Nenhum box disponível no momento</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  welcome: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 24 },
  greetingAccent: { color: '#F5A623' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  link: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  boxGrid: { gap: 16 },
  emptyText: { textAlign: 'center', paddingVertical: 32, color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});
