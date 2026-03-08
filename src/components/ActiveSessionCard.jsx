import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parse, differenceInSeconds } from 'date-fns';

export default function ActiveSessionCard({ booking, onOpenSession }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const endDt = parse(`${booking.date} ${booking.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
  const startDt = parse(`${booking.date} ${booking.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
  const total = differenceInSeconds(endDt, startDt);
  const remaining = Math.max(0, differenceInSeconds(endDt, now));
  const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.liveRow}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>Sessão Ativa</Text>
        </View>
        <TouchableOpacity onPress={onOpenSession}>
          <Text style={styles.link}>Controlar →</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.boxName}>{booking.box_name}</Text>
      <Text style={styles.time}>
        {booking.start_time} — {booking.end_time}
      </Text>
      <View style={styles.remainingRow}>
        <Text style={styles.remainingLabel}>Restante</Text>
        <Text style={styles.remainingValue}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <TouchableOpacity style={styles.cta} onPress={onOpenSession}>
        <Ionicons name="open" size={16} color="#000" />
        <Text style={styles.ctaText}>Abrir Sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(247,148,29,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(247,148,29,0.3)',
    borderRadius: 16,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f7941d' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#f7941d', letterSpacing: 1 },
  link: { fontSize: 12, color: '#f7941d', fontWeight: '500' },
  boxName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  time: { fontSize: 12, color: '#fff', marginBottom: 12 },
  remainingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  remainingLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  remainingValue: { fontSize: 24, fontWeight: '700', color: '#f7941d', fontVariant: ['tabular-nums'] },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: '#f7941d', borderRadius: 3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f7941d',
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
