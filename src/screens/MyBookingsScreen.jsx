import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const rootNav = useRootNavigation();
  const [user, setUser] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: () => api.entities.Booking.filter({ user_email: user?.email }, '-date', 100),
    enabled: !!user?.email,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.entities.Booking.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming') {
      const isUpcomingStatus =
        b.status === 'pending_payment' ||
        b.status === 'confirmed' ||
        b.status === 'active';
      return isUpcomingStatus && (b.date >= today || b.status === 'pending_payment');
    }
    if (filter === 'past')
      return (
        b.status === 'completed' ||
        (b.date < today && b.status !== 'pending_payment' && b.status !== 'cancelled')
      );
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const filters = [
    { key: 'upcoming', label: 'Próximas' },
    { key: 'past', label: 'Concluídas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Minhas Reservas</Text>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          iconName="calendar"
          title="Nenhuma reserva"
          description="Você ainda não tem reservas nesta categoria"
          action={
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => rootNav.navigate('ExploreMap')}
            >
              <Text style={styles.emptyCtaText}>Encontrar Box</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedId(expandedId === booking.id ? null : booking.id);
                }}
              >
                <View>
                  <Text style={styles.boxName}>{booking.box_name}</Text>
                  <Text style={styles.meta}>
                    {format(new Date(booking.date), 'dd MMM yyyy', { locale: ptBR })} ·{' '}
                    {booking.start_time} — {booking.end_time}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <StatusBadge status={booking.status} />
                  <Ionicons
                    name={expandedId === booking.id ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="rgba(255,255,255,0.3)"
                  />
                </View>
              </TouchableOpacity>

              {expandedId === booking.id && (
                <View style={styles.cardExpand}>
                  {booking.access_code && booking.status !== 'cancelled' && (
                    <View style={styles.accessCode}>
                      <Text style={styles.accessCodeLabel}>Código de Acesso</Text>
                      <Text style={styles.accessCodeValue}>{booking.access_code}</Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <View>
                      <Text style={styles.detailLabel}>Valor</Text>
                      <Text style={styles.detailValue}>R$ {booking.total_price?.toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Pagamento</Text>
                      <Text style={styles.detailValue}>
                        {booking.payment_method === 'credit_card'
                          ? 'Cartão'
                          : booking.payment_method === 'pix'
                          ? 'PIX'
                          : 'Créditos'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    {booking.status === 'active' && (
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => rootNav.navigate('BoxSession', { bookingId: booking.id })}
                      >
                        <Text style={styles.primaryBtnText}>Controlar Box</Text>
                      </TouchableOpacity>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending_payment') && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => cancelMutation.mutate(booking.id)}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: { backgroundColor: '#F5A623' },
  filterText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  filterTextActive: { color: '#000' },
  list: { gap: 12 },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boxName: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  cardExpand: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  accessCode: {
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  accessCodeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  accessCodeValue: { fontSize: 24, fontWeight: '700', color: '#F5A623', letterSpacing: 4 },
  detailsRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#F5A623' },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, backgroundColor: '#F5A623', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#f87171', fontWeight: '500' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5A623',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
