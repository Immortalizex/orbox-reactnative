import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const statusConfig = {
  online: { label: 'Disponível', bg: 'rgba(34,197,94,0.2)', text: '#4ade80' },
  in_use: { label: 'Em uso', bg: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
  maintenance: { label: 'Manutenção', bg: 'rgba(239,68,68,0.2)', text: '#f87171' },
  offline: { label: 'Offline', bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.3)' },
};

function BoxStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.offline;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

export default function BoxCard({ box, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        {box.image_url ? (
          <Image source={{ uri: box.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="barbell" size={48} color="rgba(255,255,255,0.1)" />
          </View>
        )}
        <View style={styles.badgeWrap}>
          <BoxStatusBadge status={box.status} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{box.name}</Text>
        <Text style={styles.address} numberOfLines={1}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.4)" /> {box.address}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.hours}>
            {box.operating_hours_start || '06:00'} - {box.operating_hours_end || '23:00'}
          </Text>
          <Text style={styles.price}>R$ {box.price_per_hour?.toFixed(2)}<Text style={styles.priceUnit}>/hora</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  imageWrap: { height: 160, backgroundColor: '#1a1a1a' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { position: 'absolute', top: 12, left: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  body: { padding: 16 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  address: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hours: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  price: { fontSize: 14, fontWeight: '700', color: '#F5A623' },
  priceUnit: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.3)' },
});
