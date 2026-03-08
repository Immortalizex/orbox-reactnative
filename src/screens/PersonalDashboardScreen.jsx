import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '../components/GradientButton';

const LEVEL_LABELS = {
  trainee: { label: 'Trainee', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' },
  certified: { label: 'Certificado', color: '#60a5fa', bg: 'rgba(59,130,246,0.2)' },
  premium: { label: 'Premium', color: '#f7941d', bg: 'rgba(247,148,29,0.2)' },
};

export default function PersonalDashboardScreen() {
  const rootNav = useRootNavigation();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['myPersonalProfile', user?.email],
    queryFn: () => api.entities.Personal.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const profile = profiles[0];

  const { data: plantoes = [] } = useQuery({
    queryKey: ['openPlantoes'],
    queryFn: () => api.entities.PlantaoShift.filter({ status: 'open' }, '-date', 20),
    enabled: !!profile,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews', profile?.id],
    queryFn: () => api.entities.PersonalReview.filter({ personal_id: profile?.id }, '-created_date', 10),
    enabled: !!profile?.id,
  });

  const applyPlantao = useMutation({
    mutationFn: async (plantao) => {
      const updated = [...(plantao.candidates || []), profile.id];
      await api.entities.PlantaoShift.update(plantao.id, { candidates: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['openPlantoes'] }),
  });

  if (!user) return null;

  if (!profile) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.centerTitle}>Você ainda não é um personal cadastrado</Text>
        <Text style={styles.centerSubtitle}>Cadastre-se para acessar seu dashboard</Text>
        <GradientButton style={styles.primaryBtn} onPress={() => rootNav.navigate('PersonalRegister')}>
          Cadastrar como Personal
        </GradientButton>
      </View>
    );
  }

  if (profile.status === 'pending') {
    return (
      <View style={styles.centerScreen}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(234,179,8,0.2)' }]}>
          <Ionicons name="time" size={32} color="#facc15" />
        </View>
        <Text style={styles.centerTitle}>Cadastro em análise</Text>
        <Text style={styles.centerSubtitle}>
          Seu perfil está sendo analisado pela equipe OrBox Fit. Você será notificado assim que aprovado.
        </Text>
      </View>
    );
  }

  const level = LEVEL_LABELS[profile.level] || LEVEL_LABELS.trainee;
  const nextLevelSessions = profile.level === 'trainee' ? 20 : profile.level === 'certified' ? 50 : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{profile.full_name?.[0]}</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
              <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Dashboard do Personal</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: 'Sessões', value: profile.total_sessions || 0, icon: 'calendar' },
          { label: 'Avaliação', value: profile.average_rating?.toFixed(1) || '—', icon: 'star', accent: true },
          { label: 'Avaliações', value: profile.total_ratings || 0, icon: 'trending-up' },
          { label: 'Ganhos', value: `R$${(profile.total_earnings || 0).toFixed(0)}`, icon: 'cash' },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, s.accent && styles.statCardAccent]}>
            <Ionicons name={s.icon} size={16} color={s.accent ? '#f7941d' : 'rgba(255,255,255,0.3)'} />
            <Text style={[styles.statValue, s.accent && styles.statValueAccent]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {nextLevelSessions && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progresso de nível</Text>
            <Text style={styles.progressCount}>{profile.total_sessions || 0}/{nextLevelSessions} sessões</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, ((profile.total_sessions || 0) / nextLevelSessions) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressNext}>
            Próximo nível: {profile.level === 'trainee' ? 'Certificado' : 'Premium'}
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Plantões disponíveis</Text>
      {plantoes.length === 0 ? (
        <Text style={styles.empty}>Nenhum plantão disponível no momento</Text>
      ) : (
        plantoes.map((p) => {
          const applied = p.candidates?.includes(profile.id);
          return (
            <View key={p.id} style={styles.plantaoCard}>
              <View>
                <Text style={styles.plantaoBox}>{p.box_name}</Text>
                <Text style={styles.plantaoMeta}>
                  {format(parse(p.date, 'yyyy-MM-dd', new Date()), 'dd/MM', { locale: ptBR })} · {p.start_time} — {p.end_time}
                </Text>
                <Text style={styles.plantaoSlots}>{p.slots} vaga(s)</Text>
              </View>
              {applied ? (
                <TouchableOpacity style={[styles.applyBtn, styles.applyBtnDone]} disabled>
                  <Text style={styles.applyBtnTextDone}>Candidatado</Text>
                </TouchableOpacity>
              ) : (
                <GradientButton
                  style={styles.applyBtn}
                  contentStyle={styles.applyBtnContent}
                  shine={false}
                  onPress={() => applyPlantao.mutate(p)}
                >
                  Candidatar
                </GradientButton>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Avaliações recentes</Text>
      {reviews.length === 0 ? (
        <Text style={styles.empty}>Nenhuma avaliação ainda</Text>
      ) : (
        reviews.slice(0, 5).map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewAuthor}>{r.user_name || 'Usuário'}</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons key={n} name={n <= r.rating ? 'star' : 'star-outline'} size={12} color="#f7941d" />
                ))}
              </View>
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 40 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  centerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 16 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  levelText: { fontSize: 12, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#fff', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#141414',
  },
  statCardAccent: { backgroundColor: 'rgba(247,148,29,0.08)', borderColor: 'rgba(247,148,29,0.2)' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 8 },
  statValueAccent: { color: '#f7941d' },
  statLabel: { fontSize: 12, color: '#fff', marginTop: 4 },
  progressCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '500', color: '#fff' },
  progressCount: { fontSize: 12, color: '#fff' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f7941d', borderRadius: 4 },
  progressNext: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  empty: { color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  plantaoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  plantaoBox: { fontSize: 14, fontWeight: '600', color: '#fff' },
  plantaoMeta: { fontSize: 12, color: '#fff', marginTop: 4 },
  plantaoSlots: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  applyBtn: {},
  applyBtnContent: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, minHeight: 36 },
  applyBtnDone: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start' },
  applyBtnText: { color: '#1a1a1a', fontWeight: '700', fontSize: 12 },
  applyBtnTextDone: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 12 },
  reviewCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 14, fontWeight: '500', color: '#fff' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
});
