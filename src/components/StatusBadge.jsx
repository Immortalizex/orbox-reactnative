import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const presets = {
  pending_payment: { label: 'Pagamento pendente', bg: 'rgba(234,179,8,0.2)', text: '#facc15', dot: '#facc15' },
  confirmed: { label: 'Confirmada', bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', dot: '#60a5fa' },
  active: { label: 'Em andamento', bg: 'rgba(34,197,94,0.2)', text: '#4ade80', dot: '#4ade80' },
  completed: { label: 'Concluída', bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)', dot: 'rgba(255,255,255,0.4)' },
  cancelled: { label: 'Cancelada', bg: 'rgba(239,68,68,0.2)', text: '#f87171', dot: '#f87171' },
  online: { label: 'Online', bg: 'rgba(34,197,94,0.2)', text: '#4ade80', dot: '#4ade80' },
  offline: { label: 'Offline', bg: 'rgba(239,68,68,0.2)', text: '#f87171', dot: '#f87171' },
  maintenance: { label: 'Manutenção', bg: 'rgba(234,179,8,0.2)', text: '#facc15', dot: '#facc15' },
  open: { label: 'Aberto', bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', dot: '#60a5fa' },
  in_progress: { label: 'Em Progresso', bg: 'rgba(234,179,8,0.2)', text: '#facc15', dot: '#facc15' },
  resolved: { label: 'Resolvido', bg: 'rgba(34,197,94,0.2)', text: '#4ade80', dot: '#4ade80' },
  closed: { label: 'Fechado', bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.6)', dot: 'rgba(255,255,255,0.4)' },
};

export default function StatusBadge({ status }) {
  const config = presets[status] || {
    label: status,
    bg: 'rgba(255,255,255,0.1)',
    text: 'rgba(255,255,255,0.6)',
    dot: 'rgba(255,255,255,0.4)',
  };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '500' },
});
