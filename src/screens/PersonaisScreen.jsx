import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { api } from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const LEVEL_LABELS = {
  trainee: { label: 'Trainee', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' },
  certified: { label: 'Certificado', color: '#60a5fa', bg: 'rgba(59,130,246,0.2)' },
  premium: { label: 'Premium', color: '#F5A623', bg: 'rgba(245,166,35,0.2)' },
};

const SPECIALTY_COLORS = [
  'rgba(168,85,247,0.2)',
  'rgba(34,197,94,0.2)',
  'rgba(236,72,153,0.2)',
  'rgba(34,211,238,0.2)',
];

export default function PersonaisScreen() {
  const rootNav = useRootNavigation();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const { data: personais = [], isLoading } = useQuery({
    queryKey: ['activePersonais'],
    queryFn: () => api.entities.Personal.filter({ status: 'active' }, '-average_rating', 50),
  });

  const filtered = personais.filter((p) => {
    const matchSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.specialties?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchLevel = filterLevel === 'all' || p.level === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Personais</Text>
          <Text style={styles.subtitle}>Treinos assistidos por profissionais certificados</Text>
        </View>
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => rootNav.navigate('PersonalRegister')}
        >
          <Ionicons name="person-add" size={16} color="#F5A623" />
          <Text style={styles.registerBtnText}>Quero ser Personal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou especialidade..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'trainee', label: 'Trainee' },
          { key: 'certified', label: 'Certificado' },
          { key: 'premium', label: 'Premium' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filterLevel === f.key && styles.filterBtnActive]}
            onPress={() => setFilterLevel(f.key)}
          >
            <Text style={[styles.filterText, filterLevel === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#F5A623" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell" size={40} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>Nenhum personal encontrado</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((p) => {
            const level = LEVEL_LABELS[p.level] || LEVEL_LABELS.trainee;
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                onPress={() => rootNav.navigate('PersonalProfile', { personalId: p.id })}
              >
                <View style={styles.cardInner}>
                  {p.photo_url ? (
                    <Image source={{ uri: p.photo_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>{p.full_name?.[0] || 'P'}</Text>
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.personalName}>{p.full_name}</Text>
                      <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
                        <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#F5A623" />
                      <Text style={styles.ratingText}>
                        {p.average_rating?.toFixed(1) || '—'} ({p.total_ratings || 0})
                      </Text>
                    </View>
                    <Text style={styles.price}>R$ {p.price_per_session?.toFixed(2)}/sessão</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                </View>
                {p.specialties?.length > 0 && (
                  <View style={styles.specialties}>
                    {p.specialties.slice(0, 3).map((s, idx) => (
                      <View
                        key={idx}
                        style={[styles.specialtyTag, { backgroundColor: SPECIALTY_COLORS[idx % 4] }]}
                      >
                        <Text style={styles.specialtyText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
  },
  registerBtnText: { color: '#F5A623', fontSize: 14, fontWeight: '500' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  searchInput: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: { backgroundColor: '#F5A623', borderColor: 'transparent' },
  filterText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterTextActive: { color: '#000' },
  loading: { paddingVertical: 48, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 12 },
  grid: { gap: 16 },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 12 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  personalName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  levelText: { fontSize: 10, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  price: { fontSize: 12, fontWeight: '700', color: '#F5A623', marginTop: 4 },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  specialtyTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  specialtyText: { fontSize: 10, color: '#fff' },
});
