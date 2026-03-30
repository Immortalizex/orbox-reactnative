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
  Modal,
  Image,
  Pressable,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import GradientButton from '../components/GradientButton';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const rootNav = useRootNavigation();
  const [user, setUser] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [pixModal, setPixModal] = useState(null);
  const [cardModal, setCardModal] = useState(null);
  const [syncReservationId, setSyncReservationId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const bookingId = route?.params?.bookingId;
    if (bookingId) {
      setFilter('upcoming');
      setExpandedId(bookingId);
      setSyncReservationId(bookingId);
    }
  }, [route?.params?.bookingId]);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['myBookings', user?.email],
    queryFn: () => api.entities.Booking.filter({ user_email: user?.email }, '-date', 100),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (!syncReservationId || !user?.email) return;

    let cancelled = false;
    let tries = 0;
    const maxTries = 24; // ~1 minute @ 2.5s

    const tick = async () => {
      tries += 1;
      try {
        const res = await refetch();
        const list = Array.isArray(res?.data) ? res.data : [];
        const current = list.find((b) => b?.id === syncReservationId);

        // Stop as soon as backend reflects a non-pending state
        if (!current || (current.status && current.status !== 'pending_payment')) {
          if (!cancelled) setSyncReservationId(null);
          return;
        }
      } catch {
        // ignore transient errors and keep polling
      }

      if (!cancelled && tries >= maxTries) setSyncReservationId(null);
    };

    // run immediately, then poll
    tick();
    const id = setInterval(() => {
      if (cancelled) return;
      tick();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [syncReservationId, user?.email, refetch]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.email) refetch();
    }, [user?.email, refetch])
  );

  const cancelMutation = useMutation({
    mutationFn: (id) => api.entities.Booking.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ reservationId, amount, method, cardToken, billingAddress }) => {
      const res = await api.payments.create({ reservationId, amount, method: method || 'pix', cardToken, billingAddress });
      return res;
    },
    onMutate: async ({ reservationId }) => {
      // Immediate UI feedback: mark as pending payment in local cache
      if (!user?.email) return;
      const key = ['myBookings', user.email];
      queryClient.setQueryData(key, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((b) => (b?.id === reservationId ? { ...b, status: b.status || 'pending_payment' } : b));
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      const method = variables?.method || 'pix';

      const checkoutUrl =
        data?.checkout_url ??
        data?.checkoutUrl ??
        data?.payment_url ??
        data?.paymentUrl ??
        data?.redirect_url ??
        data?.redirectUrl ??
        data?.url;

      if (method === 'credit_card' || method === 'card') {
        if (typeof checkoutUrl === 'string' && checkoutUrl.startsWith('http')) {
          Linking.openURL(checkoutUrl).catch(() => alert('Não foi possível abrir o link do pagamento.'));
          return;
        }
        const status = data?.status || data?.payment?.status;
        if (status === 'paid') alert('Pagamento aprovado!');
        else alert('Pagamento com cartão iniciado. Aguarde a confirmação.');
        return;
      }

      const qrCodeUrl = data?.qr_code_url ?? data?.qrCodeUrl;
      const qrCode = data?.qr_code ?? data?.qrCode;
      setPixModal({ qr_code_url: qrCodeUrl, qr_code: qrCode });
    },
    onSettled: (_data, _error, variables) => {
      // Start a short sync loop so the status flips ASAP after backend confirms payment
      if (variables?.reservationId) setSyncReservationId(variables.reservationId);
    },
    onError: (err) => {
      const isBackendDisabled =
        typeof err?.message === 'string' && err.message.includes('backend');

      const apiMsg =
        err?.data?.message ||
        err?.data?.error ||
        err?.data?.details?.message ||
        err?.data?.details?.error;

      const msg = isBackendDisabled
        ? 'Pagamento disponível apenas com o backend configurado.'
        : apiMsg
        ? String(apiMsg)
        : err?.message || 'Não foi possível processar o pagamento.';

      // Helpful debugging without crashing the UI
      try {
        console.log('Payment error', { status: err?.status, message: err?.message, data: err?.data });
      } catch {}

      alert(msg);
    },
  });

  async function getPagarmePublicKey() {
    const s = await api.getPublicSettings?.();
    const k = s?.pagarmePublicKey || s?.pagarme_public_key || s?.pagarme_publicKey;
    if (!k) throw new Error('Chave pública do Pagar.me não configurada (PAGARME_PUBLIC_KEY).');
    return String(k);
  }

  async function pagarmeCreateCardToken(publicKey, card) {
    const url = `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'card', card }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.errors?.[0]?.message || 'Falha ao tokenizar cartão.';
      throw new Error(String(msg));
    }
    if (!data?.id) throw new Error('Pagar.me não retornou token do cartão.');
    return data.id;
  }

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
    <>
      <Modal visible={!!pixModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPixModal(null)}>
          <Pressable style={styles.pixModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pixModalTitle}>Pague com PIX</Text>
            <Text style={styles.pixModalDesc}>
              {pixModal?.qr_code_url || pixModal?.qr_code
                ? 'Escaneie o QR Code no app do seu banco'
                : 'Pagamento iniciado. O QR Code será exibido em instantes ou você receberá a confirmação em breve.'}
            </Text>
            {pixModal?.qr_code_url ? (
              <Image source={{ uri: pixModal.qr_code_url }} style={styles.pixQrImage} resizeMode="contain" />
            ) : pixModal?.qr_code ? (
              <Text style={styles.pixCodeText} selectable>{pixModal.qr_code}</Text>
            ) : null}
            <GradientButton
              style={styles.pixModalBtn}
              contentStyle={styles.pixModalBtnContent}
              onPress={() => setPixModal(null)}
            >
              Fechar
            </GradientButton>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={!!cardModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setCardModal(null)}>
          <Pressable style={styles.cardModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pixModalTitle}>Pagar com cartão</Text>
            <Text style={styles.pixModalDesc}>Digite os dados do cartão para finalizar.</Text>

            <TextInput
              placeholder="Número do cartão"
              placeholderTextColor="rgba(255,255,255,0.35)"
              keyboardType="number-pad"
              value={cardModal?.number || ''}
              onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), number: t }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Nome no cartão"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={cardModal?.holder_name || ''}
              onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), holder_name: t }))}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="MM"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                value={cardModal?.exp_month || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), exp_month: t }))}
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                placeholder="AA"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                value={cardModal?.exp_year || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), exp_year: t }))}
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                placeholder="CVV"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                secureTextEntry
                value={cardModal?.cvv || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), cvv: t }))}
                style={[styles.input, styles.inputHalf]}
              />
            </View>

            <Text style={styles.sectionTitle}>Endereço de cobrança (recomendado)</Text>
            <TextInput
              placeholder="Linha 1 (Número, Rua, Bairro)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={cardModal?.billing?.line_1 || ''}
              onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), billing: { ...((s || {}).billing || {}), line_1: t } }))}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                placeholder="CEP"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
                value={cardModal?.billing?.zip_code || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), billing: { ...((s || {}).billing || {}), zip_code: t } }))}
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                placeholder="Cidade"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={cardModal?.billing?.city || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), billing: { ...((s || {}).billing || {}), city: t } }))}
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                placeholder="UF"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={cardModal?.billing?.state || ''}
                onChangeText={(t) => setCardModal((s) => ({ ...(s || {}), billing: { ...((s || {}).billing || {}), state: t } }))}
                style={[styles.input, styles.inputHalf]}
              />
            </View>

            <TouchableOpacity
              style={[styles.secondaryBtn, payMutation.isPending && styles.secondaryBtnDisabled]}
              disabled={payMutation.isPending}
              onPress={async () => {
                try {
                  const ctx = cardModal || {};
                  const publicKey = await getPagarmePublicKey();
                  const token = await pagarmeCreateCardToken(publicKey, {
                    number: String(ctx.number || '').replace(/\s/g, ''),
                    holder_name: String(ctx.holder_name || '').trim(),
                    exp_month: String(ctx.exp_month || '').trim(),
                    exp_year: String(ctx.exp_year || '').trim(),
                    cvv: String(ctx.cvv || '').trim(),
                  });
                  setCardModal(null);
                  payMutation.mutate({
                    reservationId: ctx.reservationId,
                    amount: ctx.amount,
                    method: 'credit_card',
                    cardToken: token,
                    billingAddress: ctx?.billing
                      ? {
                          line_1: ctx.billing.line_1,
                          line_2: ctx.billing.line_2,
                          zip_code: ctx.billing.zip_code,
                          city: ctx.billing.city,
                          state: ctx.billing.state,
                          country: 'BR',
                        }
                      : undefined,
                  });
                } catch (e) {
                  alert(e?.message || 'Não foi possível processar o cartão.');
                }
              }}
            >
              <View style={styles.btnRow}>
                {payMutation.isPending ? (
                  <ActivityIndicator color="#f89b14" />
                ) : (
                  <Ionicons name="lock-closed-outline" size={16} color="#f89b14" />
                )}
                <Text style={styles.secondaryBtnText}>{payMutation.isPending ? 'Processando…' : 'Finalizar pagamento'}</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
            <GradientButton
              style={styles.emptyCta}
              contentStyle={styles.emptyCtaContent}
              row
              onPress={() => rootNav.navigate('ExploreMap')}
            >
              <Text style={styles.emptyCtaText}>Encontrar Box</Text>
              <Ionicons name="arrow-forward" size={16} color="#1a1a1a" />
            </GradientButton>
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
                      <GradientButton
                        style={styles.primaryBtn}
                        contentStyle={styles.primaryBtnContent}
                        textStyle={styles.primaryBtnText}
                        row
                        onPress={() => rootNav.navigate('BoxSession', { bookingId: booking.id })}
                      >
                        <View style={styles.btnRow}>
                          <Ionicons name="settings-outline" size={16} color="#1a1a1a" />
                          <Text style={styles.primaryBtnText}>Controlar</Text>
                        </View>
                      </GradientButton>
                    )}
                    {booking.status === 'pending_payment' && (
                      <View style={styles.payRow}>
                        <GradientButton
                          style={[styles.primaryBtn, styles.payBtnHalf]}
                          contentStyle={styles.primaryBtnContent}
                          textStyle={styles.primaryBtnText}
                          row
                          onPress={() =>
                            payMutation.mutate({
                              reservationId: booking.id,
                              amount: booking.total_price ?? booking.total_amount ?? 0,
                              method: 'pix',
                            })
                          }
                          disabled={payMutation.isPending}
                        >
                          {payMutation.isPending ? (
                            'Processando…'
                          ) : (
                            <View style={styles.btnRow}>
                              <Ionicons name="qr-code-outline" size={16} color="#1a1a1a" />
                              <Text style={styles.primaryBtnText}>PIX</Text>
                            </View>
                          )}
                        </GradientButton>
                        <TouchableOpacity
                          style={[styles.secondaryBtn, styles.payBtnHalf, payMutation.isPending && styles.secondaryBtnDisabled]}
                          onPress={() =>
                            setCardModal({
                              reservationId: booking.id,
                              amount: booking.total_price ?? booking.total_amount ?? 0,
                              number: '',
                              holder_name: '',
                              exp_month: '',
                              exp_year: '',
                              cvv: '',
                              billing: { line_1: '', zip_code: '', city: '', state: '' },
                            })
                          }
                          disabled={payMutation.isPending}
                        >
                          {payMutation.isPending ? (
                            <Text style={styles.secondaryBtnText}>Processando…</Text>
                          ) : (
                            <View style={styles.btnRow}>
                              <Ionicons name="card-outline" size={16} color="#f89b14" />
                              <Text style={styles.secondaryBtnText}>Cartão</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending_payment') && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => cancelMutation.mutate(booking.id)}
                        disabled={payMutation.isPending}
                      >
                        <View style={styles.btnRow}>
                          <Ionicons name="close-circle-outline" size={16} color="#f87171" />
                          <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: { backgroundColor: '#f89b14', borderRadius: 14 },
  filterText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  filterTextActive: { color: '#1a1a1a' },
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
  meta: { fontSize: 12, color: '#fff' },
  cardExpand: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  accessCode: {
    backgroundColor: 'rgba(247,148,29,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(247,148,29,0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  accessCodeLabel: { fontSize: 12, color: '#fff', marginBottom: 4 },
  accessCodeValue: { fontSize: 24, fontWeight: '700', color: '#f7941d', letterSpacing: 4 },
  detailsRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#f7941d' },
  actions: { gap: 10 },
  payRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtnHalf: { flexGrow: 1, flexBasis: 140 },
  primaryBtn: { alignSelf: 'stretch' },
  primaryBtnContent: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 42, borderRadius: 14 },
  primaryBtnText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  secondaryBtn: {
    minHeight: 42,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,155,20,0.55)',
    backgroundColor: 'rgba(248,155,20,0.08)',
  },
  secondaryBtnDisabled: { opacity: 0.55 },
  secondaryBtnText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
    color: '#f89b14',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cancelBtn: {
    alignSelf: 'stretch',
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
  },
  cancelBtnText: {
    color: '#f87171',
    fontWeight: '500',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyCta: {},
  emptyCtaContent: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  emptyCtaText: { color: '#1a1a1a', fontWeight: '700', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pixModalBox: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
  },
  cardModalBox: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    minWidth: 320,
    maxWidth: 420,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  sectionTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6, marginBottom: 8, fontWeight: '600' },
  pixModalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  pixModalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  pixQrImage: { width: 200, height: 200, marginBottom: 20 },
  pixCodeText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 16, maxWidth: 260 },
  pixModalBtn: {},
  pixModalBtnContent: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  pixModalBtnText: { color: '#1a1a1a', fontWeight: '700', fontSize: 14 },
});
