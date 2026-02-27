import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const LEVEL_LABELS = {
  trainee: { label: 'Trainee', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' },
  certified: { label: 'Certificado', color: '#60a5fa', bg: 'rgba(59,130,246,0.2)' },
  premium: { label: 'Premium', color: '#F5A623', bg: 'rgba(245,166,35,0.2)' },
};

export default function PersonalProfileScreen() {
  const route = useRoute();
  const rootNav = useRootNavigation();
  const personalId = route.params?.personalId;
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: personal } = useQuery({
    queryKey: ['personal', personalId],
    queryFn: async () => {
      const list = await api.entities.Personal.filter({ id: personalId });
      return list[0];
    },
    enabled: !!personalId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', personalId],
    queryFn: () => api.entities.PersonalReview.filter({ personal_id: personalId }, '-created_date', 20),
    enabled: !!personalId,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      await api.entities.PersonalReview.create({
        personal_id: personalId,
        personal_name: personal.full_name,
        booking_id: 'manual',
        user_email: user?.email,
        user_name: user?.full_name,
        rating,
        comment,
      });
      const newTotal = (personal.total_ratings || 0) + 1;
      const newAvg =
        ((personal.average_rating || 0) * (personal.total_ratings || 0) + rating) / newTotal;
      await api.entities.Personal.update(personalId, {
        total_ratings: newTotal,
        average_rating: newAvg,
      });
    },
    onSuccess: () => {
      setShowReview(false);
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', personalId] });
    },
  });

  if (!personal) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  const level = LEVEL_LABELS[personal.level] || LEVEL_LABELS.trainee;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => rootNav.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        {personal.photo_url ? (
          <Image source={{ uri: personal.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{personal.full_name?.[0]}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{personal.full_name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
              <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F5A623" />
            <Text style={styles.ratingText}>
              {personal.average_rating?.toFixed(1) || '—'} ({personal.total_ratings || 0} avaliações)
            </Text>
          </View>
          <Text style={styles.price}>R$ {personal.price_per_session?.toFixed(2)}/sessão</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Sessões', value: personal.total_sessions || 0, icon: 'barbell' },
          { label: 'CREF', value: personal.cref || '—', icon: 'shield-checkmark' },
          { label: 'Avaliação', value: personal.average_rating?.toFixed(1) || '—', icon: 'star' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={16} color="rgba(255,255,255,0.3)" />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {personal.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bio}>{personal.bio}</Text>
        </View>
      ) : null}

      {personal.specialties?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.specialties}>
            {personal.specialties.map((s, i) => (
              <View key={i} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.bookCta}
        onPress={() => rootNav.navigate('BookBox')}
      >
        <Ionicons name="calendar" size={20} color="#000" />
        <Text style={styles.bookCtaText}>Agendar com {personal.full_name?.split(' ')[0]}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          <TouchableOpacity onPress={() => setShowReview(!showReview)}>
            <Text style={styles.addReviewLink}>+ Avaliar</Text>
          </TouchableOpacity>
        </View>
        {showReview && (
          <View style={styles.reviewForm}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons
                    name={n <= rating ? 'star' : 'star-outline'}
                    size={24}
                    color="#F5A623"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Deixe um comentário (opcional)..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={() => submitReview.mutate()}
              disabled={submitReview.isPending}
            >
              <Text style={styles.submitReviewBtnText}>
                {submitReview.isPending ? 'Enviando...' : 'Enviar Avaliação'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {reviews.length === 0 && !showReview && (
          <Text style={styles.noReviews}>Nenhuma avaliação ainda</Text>
        )}
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewCardTop}>
              <Text style={styles.reviewAuthor}>{r.user_name || 'Usuário'}</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={n <= r.rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#F5A623"
                  />
                ))}
              </View>
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 48, marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 16, borderWidth: 4, borderColor: '#0a0a0a' },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#0a0a0a',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1, marginLeft: 16, paddingBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  levelText: { fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  price: { fontSize: 14, fontWeight: '700', color: '#F5A623', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
  },
  specialtyText: { fontSize: 12, color: '#F5A623', fontWeight: '500' },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  bookCtaText: { color: '#000', fontWeight: '700', fontSize: 16 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addReviewLink: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  reviewForm: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  starsRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitReviewBtnText: { color: '#000', fontWeight: '700' },
  noReviews: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, paddingVertical: 24 },
  reviewCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: '#fff' },
  reviewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
});
