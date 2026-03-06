import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, parse, differenceInSeconds } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'qrcode';

export default function BoxSessionScreen() {
  const route = useRoute();
  const rootNav = useRootNavigation();
  const queryClient = useQueryClient();
  const bookingId = route.params?.bookingId;

  const [doorOpening, setDoorOpening] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [openQrModal, setOpenQrModal] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const results = await api.entities.Booking.list('-created_date', 200);
      return results.find((b) => b.id === bookingId) || null;
    },
    enabled: !!bookingId,
    refetchInterval: 30000,
  });

  const { data: box, refetch: refetchBox } = useQuery({
    queryKey: ['sessionBox', booking?.box_id],
    queryFn: async () => {
      const results = await api.entities.Box.list('-created_date', 100);
      return results.find((b) => b.id === booking?.box_id) || null;
    },
    enabled: !!booking?.box_id,
    refetchInterval: 10000,
  });

  const getTimeInfo = useCallback(() => {
    if (!booking) return { remaining: 0, elapsed: 0, total: 0, progress: 0, warningClose: false };
    const startDt = parse(`${booking.date} ${booking.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDt = parse(`${booking.date} ${booking.end_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const total = differenceInSeconds(endDt, startDt);
    const elapsed = Math.max(0, differenceInSeconds(now, startDt));
    const remaining = Math.max(0, total - elapsed);
    const progress = Math.min(100, total > 0 ? (elapsed / total) * 100 : 0);
    const warningClose = remaining > 0 && remaining <= 300;
    return { remaining, elapsed, total, progress, warningClose };
  }, [booking, now]);

  const { remaining, progress, warningClose } = getTimeInfo();

  const formatCountdown = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggleDevice = useMutation({
    mutationFn: async ({ field, value }) => {
      await api.entities.Box.update(box.id, { [field]: value });
    },
    onSuccess: () => refetchBox(),
  });

  const adjustTemp = useMutation({
    mutationFn: async (delta) => {
      const newTemp = Math.min(30, Math.max(16, (box.ac_temp || 22) + delta));
      await api.entities.Box.update(box.id, { ac_temp: newTemp });
    },
    onSuccess: () => refetchBox(),
  });

  const requestOpenMutation = useMutation({
    mutationFn: (reservationId) => api.access.requestOpen(reservationId),
    onSuccess: (data) => {
      setOpenQrModal({
        code: data?.code,
        expiresAt: data?.expiresAt ? new Date(data.expiresAt) : null,
      });
    },
    onError: (err) => {
      const msg = err?.message || 'Não foi possível gerar o código. Conecte ao backend para abrir por QR.';
      Alert.alert('Abrir box', msg);
    },
  });

  useEffect(() => {
    if (!openQrModal?.code) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(openQrModal.code, { width: 280, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [openQrModal?.code]);

  const handleOpenDoor = () => {
    requestOpenMutation.mutate(booking.id);
  };

  const handleCheckOut = async () => {
    Alert.alert('Encerrar sessão', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          await api.entities.Booking.update(booking.id, {
            status: 'completed',
            checked_out: true,
            check_out_time: format(new Date(), 'HH:mm'),
          });
          if (box) {
            await api.entities.Box.update(box.id, {
              light_on: false,
              ac_on: false,
              sound_on: false,
              tv_on: false,
            });
          }
          rootNav.navigate('MyBookings');
        },
      },
    ]);
  };

  if (!booking || !box) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  const controls = [
    { label: 'Iluminação', icon: 'bulb', field: 'light_on', active: box.light_on },
    { label: 'Ar Condicionado', icon: 'thermometer', field: 'ac_on', active: box.ac_on, hasTemp: true },
    { label: 'Som', icon: 'musical-notes', field: 'sound_on', active: box.sound_on },
    { label: 'TV / Tela', icon: 'tv', field: 'tv_on', active: box.tv_on },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => rootNav.navigate('MyBookings')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Em andamento</Text>
          </View>
          <Text style={styles.boxName}>{box.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="wifi" size={16} color="#4ade80" />
        </View>
      </View>

      {warningClose && (
        <View style={styles.warning}>
          <Ionicons name="warning" size={16} color="#facc15" />
          <Text style={styles.warningText}>Sua sessão termina em breve! Prepare-se para encerrar.</Text>
        </View>
      )}

      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>Tempo restante</Text>
        <Text style={[styles.timerValue, warningClose && styles.timerValueWarning]}>
          {formatCountdown(remaining)}
        </Text>
        <Text style={styles.timerRange}>
          {booking.start_time} — {booking.end_time}
        </Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }, warningClose && styles.progressWarning]} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            doorOpen && styles.actionBtnOpen,
            (doorOpening || requestOpenMutation.isPending) && styles.actionBtnDisabled,
          ]}
          onPress={handleOpenDoor}
          disabled={doorOpening || requestOpenMutation.isPending}
        >
          {requestOpenMutation.isPending ? (
            <ActivityIndicator size="small" color="#F5A623" />
          ) : doorOpening ? (
            <ActivityIndicator size="small" color="#F5A623" />
          ) : doorOpen ? (
            <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
          ) : (
            <Ionicons name="qr-code" size={24} color="#F5A623" />
          )}
          <Text style={[styles.actionLabel, doorOpen && styles.actionLabelOpen]}>
            {requestOpenMutation.isPending ? 'Gerando QR...' : doorOpening ? 'Abrindo...' : doorOpen ? 'Aberta!' : 'Abrir Porta (QR)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => rootNav.navigate('Main', { screen: 'Support' })}
        >
          <Ionicons name="headset" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.actionLabelSecondary}>Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnDanger} onPress={handleCheckOut}>
          <Ionicons name="power" size={24} color="#f87171" />
          <Text style={styles.actionLabelDanger}>Encerrar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.controlsTitle}>Controle do Ambiente</Text>
      <View style={styles.controlsGrid}>
        {controls.map((ctrl) => (
          <TouchableOpacity
            key={ctrl.field}
            style={[styles.controlCard, ctrl.active && styles.controlCardActive]}
            onPress={() => toggleDevice.mutate({ field: ctrl.field, value: !ctrl.active })}
          >
            <View style={[styles.controlIcon, ctrl.active && styles.controlIconActive]}>
              <Ionicons
                name={ctrl.icon}
                size={20}
                color={ctrl.active ? '#F5A623' : 'rgba(255,255,255,0.3)'}
              />
            </View>
            <Text style={[styles.controlLabel, ctrl.active && styles.controlLabelActive]}>
              {ctrl.label}
            </Text>
            <Text style={[styles.controlStatus, ctrl.active && styles.controlStatusActive]}>
              {ctrl.active ? 'Ligado' : 'Desligado'}
            </Text>
            {ctrl.hasTemp && ctrl.active && (
              <View style={styles.tempControl}>
                <TouchableOpacity
                  style={styles.tempBtn}
                  onPress={(e) => { e.stopPropagation(); adjustTemp.mutate(1); }}
                >
                  <Ionicons name="chevron-up" size={12} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.tempValue}>{box.ac_temp}°</Text>
                <TouchableOpacity
                  style={styles.tempBtn}
                  onPress={(e) => { e.stopPropagation(); adjustTemp.mutate(-1); }}
                >
                  <Ionicons name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sessão: {booking.start_time} — {booking.end_time}
        </Text>
        <Text style={styles.footerText}>R$ {booking.total_price?.toFixed(2)}</Text>
      </View>

      <Modal
        visible={!!openQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenQrModal(null)}
      >
        <Pressable style={styles.qrModalOverlay} onPress={() => setOpenQrModal(null)}>
          <Pressable style={styles.qrModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.qrModalTitle}>Código para abrir o box</Text>
            <Text style={styles.qrModalHint}>Aponte o leitor QR do box para este código</Text>
            {qrDataUrl ? (
              <Image source={{ uri: qrDataUrl }} style={styles.qrImage} />
            ) : (
              <View style={[styles.qrImage, styles.qrPlaceholder]}>
                <ActivityIndicator size="large" color="#F5A623" />
              </View>
            )}
            {openQrModal?.code && (
              <Text style={styles.qrCodeText} selectable>{openQrModal.code}</Text>
            )}
            {openQrModal?.expiresAt && (
              <Text style={styles.qrExpires}>
                Expira em {format(openQrModal.expiresAt, 'HH:mm')} ({Math.max(0, Math.ceil((openQrModal.expiresAt - now) / 60000))} min)
              </Text>
            )}
            <TouchableOpacity style={styles.qrModalClose} onPress={() => setOpenQrModal(null)}>
              <Text style={styles.qrModalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', maxWidth: 480, alignSelf: 'center', width: '100%' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerCenter: { alignItems: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { fontSize: 12, fontWeight: '500', color: '#4ade80' },
  boxName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerRight: {},
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(234,179,8,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
    borderRadius: 12,
  },
  warningText: { fontSize: 12, color: '#facc15', fontWeight: '500', flex: 1 },
  timerSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  timerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  timerValue: { fontSize: 56, fontWeight: '700', color: '#F5A623', fontVariant: ['tabular-nums'] },
  timerValueWarning: { color: '#facc15' },
  timerRange: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 },
  progressBg: { marginTop: 16, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 3 },
  progressWarning: { backgroundColor: '#facc15' },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
  },
  actionBtnOpen: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  actionBtnDisabled: { opacity: 0.6 },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#F5A623', marginTop: 8 },
  actionLabelOpen: { color: '#4ade80' },
  actionBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionLabelSecondary: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  actionBtnDanger: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  actionLabelDanger: { fontSize: 12, fontWeight: '500', color: '#f87171', marginTop: 8 },
  controlsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  controlsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  controlCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#141414',
  },
  controlCardActive: { borderColor: 'rgba(245,166,35,0.3)', backgroundColor: 'rgba(245,166,35,0.08)' },
  controlIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  controlIconActive: { backgroundColor: 'rgba(245,166,35,0.2)' },
  controlLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  controlLabelActive: { color: '#fff' },
  controlStatus: { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 },
  controlStatusActive: { color: '#F5A623' },
  tempControl: { position: 'absolute', top: 12, right: 12, alignItems: 'center' },
  tempBtn: { width: 24, height: 24, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  tempValue: { fontSize: 14, fontWeight: '700', color: '#F5A623' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.2)',
  },
  qrModalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  qrModalHint: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  qrImage: { width: 280, height: 280, backgroundColor: '#fff', borderRadius: 12 },
  qrPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  qrCodeText: { fontSize: 28, fontWeight: '700', color: '#F5A623', letterSpacing: 4, marginTop: 16 },
  qrExpires: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  qrModalClose: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(245,166,35,0.2)',
    borderRadius: 12,
  },
  qrModalCloseText: { fontSize: 14, fontWeight: '600', color: '#F5A623' },
});
