import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmedScreen() {
  const route = useRoute();
  const rootNav = useRootNavigation();
  const bookingId = route.params?.bookingId;

  const { data: booking } = useQuery({
    queryKey: ['confirmedBooking', bookingId],
    queryFn: async () => {
      const results = await api.entities.Booking.list('-created_date', 200);
      return results.find((b) => b.id === bookingId) || null;
    },
    enabled: !!bookingId,
  });

  const { data: box } = useQuery({
    queryKey: ['confirmedBox', booking?.box_id],
    queryFn: async () => {
      const results = await api.entities.Box.list('-created_date', 100);
      return results.find((b) => b.id === booking?.box_id) || null;
    },
    enabled: !!booking?.box_id,
  });

  const checklist = [
    'Traga sua garrafa de água',
    'Use roupas confortáveis para treino',
    'Chegue 5 min antes para acessar com facilidade',
    'Seu código de acesso estará disponível em Reservas',
    'Ao sair, encerre a sessão pelo app',
  ];

  if (!booking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  const openMaps = () => {
    if (box?.address) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(box.address)}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="checkmark-circle" size={40} color="#F5A623" />
        </View>
        <Text style={styles.heroTitle}>Reserva Confirmada!</Text>
        <Text style={styles.heroSub}>Tudo pronto para o seu treino</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="flash" size={20} color="#F5A623" />
          </View>
          <View>
            <Text style={styles.boxName}>{booking.box_name}</Text>
            <Text style={styles.boxAddress}>{box?.address}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.details}>
          <View>
            <Text style={styles.detailLabel}>Data</Text>
            <Text style={styles.detailValue}>
              <Ionicons name="calendar" size={14} color="#F5A623" />{' '}
              {format(new Date(booking.date), 'dd MMM yyyy', { locale: ptBR })}
            </Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Horário</Text>
            <Text style={styles.detailValue}>
              <Ionicons name="time" size={14} color="#F5A623" />{' '}
              {booking.start_time} — {booking.end_time}
            </Text>
          </View>
        </View>
        {booking.access_code && (
          <View style={styles.accessCode}>
            <Text style={styles.accessCodeLabel}>Código de Acesso</Text>
            <Text style={styles.accessCodeValue}>{booking.access_code}</Text>
            <Text style={styles.accessCodeHint}>Use este código para acessar o box</Text>
          </View>
        )}
      </View>

      {box?.address && (
        <TouchableOpacity style={styles.mapCard} onPress={openMaps}>
          <View style={styles.mapCardIcon}>
            <Ionicons name="navigate" size={20} color="#60a5fa" />
          </View>
          <View style={styles.mapCardBody}>
            <Text style={styles.mapCardTitle}>Como chegar</Text>
            <Text style={styles.mapCardAddress} numberOfLines={1}>{box.address}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
      )}

      <View style={styles.checklist}>
        <View style={styles.checklistHeader}>
          <Ionicons name="shield-checkmark" size={16} color="#F5A623" />
          <Text style={styles.checklistTitle}>Checklist antes da sessão</Text>
        </View>
        {checklist.map((item, i) => (
          <View key={i} style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color="rgba(245,166,35,0.5)" />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => rootNav.navigate('MyBookings')}
      >
        <Text style={styles.primaryBtnText}>Ver Minhas Reservas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => rootNav.navigate('Main')}>
        <Text style={styles.secondaryBtnText}>Voltar ao Início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,166,35,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245,166,35,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  boxAddress: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  details: { flexDirection: 'row', gap: 24 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#fff' },
  accessCode: {
    marginTop: 16,
    backgroundColor: 'rgba(245,166,35,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  accessCodeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  accessCodeValue: { fontSize: 28, fontWeight: '700', color: '#F5A623', letterSpacing: 6 },
  accessCodeHint: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mapCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCardBody: { flex: 1, marginLeft: 12 },
  mapCardTitle: { fontSize: 14, fontWeight: '500', color: '#fff' },
  mapCardAddress: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  checklist: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  checklistTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  checkText: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  primaryBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.6)', fontWeight: '500', fontSize: 14 },
});
