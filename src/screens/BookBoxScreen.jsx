import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '../components/GradientButton';

export default function BookBoxScreen() {
  const route = useRoute();
  const rootNav = useRootNavigation();
  const queryClient = useQueryClient();
  const boxId = route.params?.boxId;

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(1);
  const [booking, setBooking] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: box } = useQuery({
    queryKey: ['box', boxId],
    queryFn: async () => {
      const boxes = await api.entities.Box.filter({ id: boxId });
      return boxes[0];
    },
    enabled: !!boxId,
  });

  const { data: existingBookings = [] } = useQuery({
    queryKey: ['boxBookings', boxId, selectedDate],
    queryFn: () =>
      api.entities.Booking.filter({
        box_id: boxId,
        date: selectedDate,
        status: 'confirmed',
      }),
    enabled: !!boxId,
  });

  const generateTimeSlots = () => {
    if (!box) return [];
    const start = parseInt(box.operating_hours_start?.split(':')[0] || '6');
    const end = parseInt(box.operating_hours_end?.split(':')[0] || '23');
    const slots = [];
    for (let h = start; h < end; h++) {
      const time = `${String(h).padStart(2, '0')}:00`;
      const booked = existingBookings.some((b) => {
        const bStart = parseInt(b.start_time?.split(':')[0]);
        const bEnd = parseInt(b.end_time?.split(':')[0]);
        return h >= bStart && h < bEnd;
      });
      const isPast =
        selectedDate === format(new Date(), 'yyyy-MM-dd') && h <= new Date().getHours();
      slots.push({ time, hour: h, booked, isPast });
    }
    return slots;
  };

  const slots = generateTimeSlots();
  const totalPrice = (box?.price_per_hour || 0) * duration;
  const endTime = selectedSlot
    ? `${String(parseInt(selectedSlot.split(':')[0]) + duration).padStart(2, '0')}:00`
    : null;

  const handleBook = async () => {
    if (!selectedSlot || !user) return;
    setBooking(true);
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await api.entities.Booking.create({
        box_id: boxId,
        box_name: box.name,
        user_email: user.email,
        user_name: user.full_name,
        date: selectedDate,
        start_time: selectedSlot,
        end_time: endTime,
        total_price: totalPrice,
        payment_method: 'credit_card',
        access_code: accessCode,
        status: 'pending_payment',
      });

      const allBookings = await api.entities.Booking.filter({
        user_email: user.email,
        date: selectedDate,
      });
      const newBooking =
        allBookings.find((b) => b.start_time === selectedSlot && b.box_id === boxId) || null;

      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      queryClient.invalidateQueries({ queryKey: ['boxBookings', boxId, selectedDate] });

      rootNav.navigate('MyBookings', { bookingId: newBooking?.id });
    } finally {
      setBooking(false);
    }
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      date: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE', { locale: ptBR }),
      day: format(d, 'dd'),
    };
  });

  if (!box) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f7941d" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {box.image_url ? (
          <Image source={{ uri: box.image_url }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="barbell" size={64} color="rgba(255,255,255,0.1)" />
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => rootNav.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.boxName}>{box.name}</Text>
        <Text style={styles.address}>
          <Ionicons name="location" size={14} color="#fff" /> {box.address}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            <Ionicons name="time" size={16} color="rgba(255,255,255,0.5)" />{' '}
            {box.operating_hours_start} - {box.operating_hours_end}
          </Text>
          <Text style={styles.metaText}>
            <Ionicons name="people" size={16} color="rgba(255,255,255,0.5)" /> {box.capacity} pessoa(s)
          </Text>
          <Text style={styles.price}>R$ {box.price_per_hour?.toFixed(2)}/h</Text>
        </View>

        <Text style={styles.sectionTitle}>Selecione a data</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {dates.map((d) => (
            <TouchableOpacity
              key={d.date}
              style={[styles.dateBtn, selectedDate === d.date && styles.dateBtnActive]}
              onPress={() => {
                setSelectedDate(d.date);
                setSelectedSlot(null);
              }}
            >
              <Text style={[styles.dateLabel, selectedDate === d.date && styles.dateLabelActive]}>
                {d.label}
              </Text>
              <Text style={[styles.dateDay, selectedDate === d.date && styles.dateDayActive]}>
                {d.day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Horários disponíveis</Text>
        <View style={styles.slotsGrid}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slotBtn,
                selectedSlot === slot.time && styles.slotBtnActive,
                (slot.booked || slot.isPast) && styles.slotBtnDisabled,
              ]}
              onPress={() => !slot.booked && !slot.isPast && setSelectedSlot(slot.time)}
              disabled={slot.booked || slot.isPast}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlot === slot.time && styles.slotTextActive,
                  (slot.booked || slot.isPast) && styles.slotTextDisabled,
                ]}
              >
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Duração</Text>
        <View style={styles.durationRow}>
          {[1, 2, 3].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                {d}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Data</Text>
            <Text style={styles.summaryValue}>
              {format(new Date(selectedDate), 'dd/MM/yyyy')}
            </Text>
          </View>
          {selectedSlot && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Horário</Text>
              <Text style={styles.summaryValue}>
                {selectedSlot} — {endTime}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duração</Text>
            <Text style={styles.summaryValue}>{duration}h</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <GradientButton
          style={(!selectedSlot || booking) && styles.bookBtnDisabled}
          contentStyle={styles.bookBtnContent}
          onPress={handleBook}
          disabled={!selectedSlot || booking}
        >
          {booking ? 'Confirmando...' : 'Confirmar Reserva'}
        </GradientButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { paddingBottom: 32 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10,10,10,0.95)' },
  hero: { height: 224, backgroundColor: '#141414', position: 'relative' },
  heroImage: { width: '100%', height: '100%', opacity: 0.6 },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 16, marginTop: -40, backgroundColor: 'rgba(10,10,10,0.95)', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  boxName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  address: { fontSize: 14, color: '#fff', marginBottom: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  metaText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  price: { fontSize: 14, fontWeight: '700', color: '#f7941d' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  datesScroll: { marginBottom: 20 },
  dateBtn: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    alignItems: 'center',
  },
  dateBtnActive: { backgroundColor: '#f89b14', borderColor: 'transparent', borderRadius: 14 },
  dateLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  dateLabelActive: { color: '#1a1a1a' },
  dateDay: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  dateDayActive: { color: '#1a1a1a' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  slotBtn: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: '#f89b14', borderColor: 'transparent', borderRadius: 14 },
  slotBtnDisabled: { opacity: 0.4 },
  slotText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  slotTextActive: { color: '#1a1a1a' },
  slotTextDisabled: { color: 'rgba(255,255,255,0.2)' },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  durationBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  durationBtnActive: {
    backgroundColor: 'rgba(247,148,29,0.15)',
    borderColor: 'rgba(247,148,29,0.3)',
  },
  durationText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  durationTextActive: { color: '#f7941d' },
  summary: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryTotal: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#fff' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#f7941d' },
  bookBtn: {},
  bookBtnContent: { paddingVertical: 16, borderRadius: 16 },
  bookBtnDisabled: { opacity: 0.3 },
});
