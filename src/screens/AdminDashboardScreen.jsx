import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuickStatCard from '../components/QuickStatCard';
import StatusBadge from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

const BOX_STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'offline', label: 'Offline' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showAddBox, setShowAddBox] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxAddress, setNewBoxAddress] = useState('');
  const [newBoxPrice, setNewBoxPrice] = useState('');
  const [newBoxCity, setNewBoxCity] = useState('');
  const [newBoxLatitude, setNewBoxLatitude] = useState('');
  const [newBoxLongitude, setNewBoxLongitude] = useState('');
  const [newBoxStatus, setNewBoxStatus] = useState('online');
  const [newBoxImageUrl, setNewBoxImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inputFocused, setInputFocused] = useState(null);
  const { data: boxes = [] } = useQuery({
    queryKey: ['adminBoxes'],
    queryFn: () => api.entities.Box.list('-created_date', 200),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => api.entities.Booking.list('-created_date', 500),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.entities.User.list('-created_date', 500),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['adminSupportTicketsCount'],
    queryFn: () => api.entities.SupportTicket.adminList({}, '-created_date', 500),
  });

  const createBox = useMutation({
    mutationFn: (data) => api.entities.Box.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBoxes'] });
      Alert.alert('Sucesso', 'Box criado com sucesso.');
      setShowAddBox(false);
      setNewBoxName('');
      setNewBoxAddress('');
      setNewBoxPrice('');
      setNewBoxCity('');
      setNewBoxLatitude('');
      setNewBoxLongitude('');
      setNewBoxStatus('online');
      setNewBoxImageUrl('');
    },
    onError: (err) => {
      const msg =
        (typeof err?.data === 'object' && err?.data?.message) ||
        err?.response?.data?.message ||
        err?.message ||
        'Falha ao criar box. Verifique se está logado como admin.';
      Alert.alert('Erro', msg);
    },
  });

  const handleAddBox = () => {
    const name = newBoxName.trim();
    const address = newBoxAddress.trim();
    const price = parseFloat(newBoxPrice?.replace(',', '.'));
    if (!name || !address) {
      Alert.alert('Campos obrigatórios', 'Preencha nome e endereço.');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Valor inválido', 'Informe um preço por hora válido.');
      return;
    }
    const lat = newBoxLatitude.trim() ? parseFloat(newBoxLatitude.replace(',', '.')) : undefined;
    const lng = newBoxLongitude.trim() ? parseFloat(newBoxLongitude.replace(',', '.')) : undefined;
    if ((newBoxLatitude.trim() || newBoxLongitude.trim()) && (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
      Alert.alert('Coordenadas inválidas', 'Latitude deve ser entre -90 e 90. Longitude entre -180 e 180.');
      return;
    }

    createBox.mutate({
      name,
      address,
      pricePerHour: price,
      ...(newBoxCity.trim() ? { city: newBoxCity.trim() } : {}),
      ...(lat != null && !isNaN(lat) ? { latitude: lat } : {}),
      ...(lng != null && !isNaN(lng) ? { longitude: lng } : {}),
      ...(newBoxImageUrl.trim() ? { imageUrl: newBoxImageUrl.trim() } : {}),
      status: newBoxStatus,
    });
  };

  const pickBoxImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingImage(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({
        file: {
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType || 'image/jpeg',
          fileName: result.assets[0].fileName || 'box.jpg',
        },
      });
      setNewBoxImageUrl(file_url || '');
    } catch (err) {
      Alert.alert('Erro', err?.message || 'Falha ao enviar imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed' || b.status === 'active')
    .reduce((s, b) => s + (b.total_price || 0), 0);
  const activeBookings = bookings.filter((b) => b.status === 'active' || b.status === 'confirmed').length;
  const onlineBoxes = boxes.filter((b) => b.status === 'online').length;
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const recentBookings = bookings.slice(0, 8);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="grid" size={20} color="#F5A623" />
          <Text style={styles.title}>Dashboard Admin</Text>
        </View>
        <TouchableOpacity
          style={styles.addBoxBtn}
          onPress={() => setShowAddBox(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.addBoxBtnText}>Novo box</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddBox} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, styles.modalBackdrop]}
            activeOpacity={1}
            onPress={() => !createBox.isPending && setShowAddBox(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
            pointerEvents="box-none"
          >
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo box</Text>
                <TouchableOpacity
                  onPress={() => !createBox.isPending && setShowAddBox(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.fieldLabel}>Imagem do box (opcional)</Text>
                {newBoxImageUrl ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: newBoxImageUrl }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setNewBoxImageUrl('')}
                    >
                      <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadImageBtn}
                    onPress={pickBoxImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#F5A623" />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.uploadImageText}>
                          {uploadingImage ? 'Enviando...' : 'Selecionar imagem'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <Text style={styles.fieldLabel}>Nome do box *</Text>
                <TextInput
                  style={[styles.input, inputFocused === 'name' && styles.inputFocused]}
                  placeholder="Ex: Box Centro"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newBoxName}
                  onChangeText={setNewBoxName}
                  onFocus={() => setInputFocused('name')}
                  onBlur={() => setInputFocused(null)}
                  autoCapitalize="words"
                  selectionColor="rgb(245, 166, 35)"
                  underlineColorAndroid="transparent"
                />
                <Text style={styles.fieldLabel}>Endereço *</Text>
                <TextInput
                  style={[styles.input, inputFocused === 'address' && styles.inputFocused]}
                  placeholder="Endereço completo"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newBoxAddress}
                  onChangeText={setNewBoxAddress}
                  onFocus={() => setInputFocused('address')}
                  onBlur={() => setInputFocused(null)}
                  autoCapitalize="sentences"
                  selectionColor="rgb(245, 166, 35)"
                  underlineColorAndroid="transparent"
                />
                <Text style={styles.fieldLabel}>Preço por hora (R$) *</Text>
                <TextInput
                  style={[styles.input, inputFocused === 'price' && styles.inputFocused]}
                  placeholder="0,00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newBoxPrice}
                  onChangeText={setNewBoxPrice}
                  onFocus={() => setInputFocused('price')}
                  onBlur={() => setInputFocused(null)}
                  keyboardType="decimal-pad"
                  selectionColor="rgb(245, 166, 35)"
                  underlineColorAndroid="transparent"
                />
                <Text style={styles.fieldLabel}>Cidade (opcional)</Text>
                <TextInput
                  style={[styles.input, inputFocused === 'city' && styles.inputFocused]}
                  placeholder="Cidade"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={newBoxCity}
                  onChangeText={setNewBoxCity}
                  onFocus={() => setInputFocused('city')}
                  onBlur={() => setInputFocused(null)}
                  autoCapitalize="words"
                  selectionColor="rgb(245, 166, 35)"
                  underlineColorAndroid="transparent"
                />
                <Text style={styles.fieldLabel}>Localização no mapa (opcional)</Text>
                <View style={styles.coordsRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputHalf,
                      inputFocused === 'lat' && styles.inputFocused,
                    ]}
                    placeholder="Latitude"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={newBoxLatitude}
                    onChangeText={setNewBoxLatitude}
                    onFocus={() => setInputFocused('lat')}
                    onBlur={() => setInputFocused(null)}
                    keyboardType="decimal-pad"
                    selectionColor="rgb(245, 166, 35)"
                    underlineColorAndroid="transparent"
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputHalf,
                      inputFocused === 'lng' && styles.inputFocused,
                    ]}
                    placeholder="Longitude"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={newBoxLongitude}
                    onChangeText={setNewBoxLongitude}
                    onFocus={() => setInputFocused('lng')}
                    onBlur={() => setInputFocused(null)}
                    keyboardType="decimal-pad"
                    selectionColor="rgb(245, 166, 35)"
                    underlineColorAndroid="transparent"
                  />
                </View>
                <Text style={styles.inputHint}>Preencha para exibir o box no mapa.</Text>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusRow}>
                  {BOX_STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.statusChip, newBoxStatus === opt.value && styles.statusChipActive]}
                      onPress={() => setNewBoxStatus(opt.value)}
                    >
                      <Text style={[styles.statusChipText, newBoxStatus === opt.value && styles.statusChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {createBox.isError && (
                  <Text style={styles.formError}>
                    {createBox.error?.data?.message ?? createBox.error?.message ?? 'Erro ao criar.'}
                  </Text>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => !createBox.isPending && setShowAddBox(false)}
                    disabled={createBox.isPending}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, createBox.isPending && styles.submitBtnDisabled]}
                    onPress={() => handleAddBox()}
                    disabled={createBox.isPending}
                    activeOpacity={0.8}
                  >
                    {createBox.isPending ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#000" />
                        <Text style={styles.submitBtnText}>Criar box</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View style={styles.statsGrid}>
        <QuickStatCard iconName="cash" label="Receita Total" value={`R$ ${totalRevenue.toFixed(0)}`} accent />
        <QuickStatCard iconName="calendar" label="Reservas Ativas" value={activeBookings} />
        <QuickStatCard iconName="cube" label="Boxes Online" value={`${onlineBoxes}/${boxes.length}`} />
        <QuickStatCard iconName="people" label="Usuários" value={users.length} />
        <TouchableOpacity
          style={styles.ticketCard}
          onPress={() => navigation.navigate('AdminSupportTickets')}
          activeOpacity={0.8}
        >
          <View style={styles.ticketCardInner}>
            <View style={[styles.iconWrap, styles.iconWrapTicket]}>
              <Ionicons name="ticket" size={20} color="#F5A623" />
            </View>
            <View>
              <Text style={styles.ticketCardLabel}>Tickets de Suporte</Text>
              <Text style={styles.ticketCardValue}>{openTickets} abertos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Reservas Recentes</Text>
      <View style={styles.table}>
        {recentBookings.map((b) => (
          <View key={b.id} style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Usuário</Text>
              <Text style={styles.cellValue}>{b.user_name || b.user_email}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Box</Text>
              <Text style={styles.cellValue}>{b.box_name}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Data</Text>
              <Text style={styles.cellValue}>
                {b.date ? format(new Date(b.date), 'dd/MM', { locale: ptBR }) : '—'}
              </Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Valor</Text>
              <Text style={styles.cellValueAccent}>R$ {b.total_price?.toFixed(2)}</Text>
            </View>
            <StatusBadge status={b.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5A623',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBoxBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCenter: { justifyContent: 'center' },
  modalCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '100%',
    minHeight: 600,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  imagePreviewWrap: { position: 'relative', marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 160, backgroundColor: '#0a0a0a' },
  removeImageBtn: { position: 'absolute', top: 8, right: 8 },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  uploadImageText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  fieldLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
  },
  inputFocused: { borderColor: 'rgb(245, 166, 35)' },
  coordsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  inputHalf: { flex: 1, marginBottom: 0, minWidth: 0 },
  inputHint: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusChipActive: { backgroundColor: 'rgba(245,166,35,0.2)', borderColor: '#F5A623' },
  statusChipText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  statusChipTextActive: { color: '#F5A623', fontWeight: '600' },
  formError: { color: '#f87171', fontSize: 13, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#000', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  ticketCard: {
    minWidth: '100%',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapTicket: { backgroundColor: 'rgba(245,166,35,0.15)' },
  ticketCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  ticketCardValue: { fontSize: 16, fontWeight: '700', color: '#F5A623' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  table: { backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  row: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12, alignItems: 'center' },
  cell: { minWidth: 80 },
  cellLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 },
  cellValue: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  cellValueAccent: { fontSize: 13, fontWeight: '600', color: '#F5A623' },
});
