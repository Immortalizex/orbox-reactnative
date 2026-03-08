import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRootNavigation } from '../hooks/useRootNavigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '../components/GradientButton';

const SPECIALTIES_OPTIONS = [
  'Musculação', 'Funcional', 'HIIT', 'Yoga', 'Pilates',
  'Crossfit', 'Corrida', 'Emagrecimento', 'Hipertrofia', 'Reabilitação', 'Idosos',
];

export default function PersonalRegisterScreen() {
  const rootNav = useRootNavigation();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    cref: '',
    bio: '',
    price_per_session: '',
    specialties: [],
    interested_in_plantao: false,
    photo_url: '',
    document_url: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
      setForm((f) => ({ ...f, full_name: u.full_name || '' }));
    }).catch(() => {});
  }, []);

  const { data: existing } = useQuery({
    queryKey: ['myPersonalProfile', user?.email],
    queryFn: () => api.entities.Personal.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const alreadyRegistered = existing?.[0];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({
        file: { uri: result.assets[0].uri, mimeType: 'image/jpeg', fileName: 'photo.jpg' },
      });
      setForm((f) => ({ ...f, photo_url: file_url }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (result.canceled) return;
    setUploadingDoc(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({
        file: {
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType || 'application/pdf',
          fileName: result.assets[0].name,
        },
      });
      setForm((f) => ({ ...f, document_url: file_url }));
    } finally {
      setUploadingDoc(false);
    }
  };

  const toggleSpecialty = (s) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));
  };

  const submit = useMutation({
    mutationFn: () =>
      api.entities.Personal.create({
        ...form,
        user_email: user.email,
        price_per_session: parseFloat(form.price_per_session) || 0,
        status: 'pending',
        level: 'trainee',
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  if (alreadyRegistered) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={32} color="#f7941d" />
        </View>
        <Text style={styles.centerTitle}>Cadastro já realizado</Text>
        <Text style={styles.centerSubtitle}>
          Status: {alreadyRegistered.status === 'pending' ? 'Em análise' : alreadyRegistered.status === 'active' ? 'Ativo' : 'Suspenso'}
        </Text>
        <GradientButton style={styles.primaryBtn} onPress={() => rootNav.navigate('PersonalDashboard')}>
          Meu Dashboard
        </GradientButton>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.centerScreen}>
        <View style={[styles.successIcon, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#4ade80" />
        </View>
        <Text style={styles.centerTitle}>Cadastro enviado!</Text>
        <Text style={styles.centerSubtitle}>
          Seu cadastro está em análise. Você receberá uma notificação quando for aprovado.
        </Text>
        <GradientButton style={styles.primaryBtn} onPress={() => rootNav.navigate('Main')}>
          Voltar ao início
        </GradientButton>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => rootNav.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Cadastro de Personal</Text>
      <Text style={styles.subtitle}>Faça parte da rede OrBox Fit</Text>

      <View style={styles.photoRow}>
        {form.photo_url ? (
          <Image source={{ uri: form.photo_url }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="cloud-upload" size={24} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <TouchableOpacity onPress={pickImage} disabled={uploadingPhoto}>
          <Text style={styles.uploadLink}>{uploadingPhoto ? 'Enviando...' : 'Upload de foto'}</Text>
        </TouchableOpacity>
      </View>

      {[
        { key: 'full_name', label: 'Nome completo', placeholder: 'Seu nome' },
        { key: 'cref', label: 'CREF', placeholder: '000000-G/UF' },
        { key: 'price_per_session', label: 'Valor por sessão (R$)', placeholder: 'Ex: 80.00', keyboardType: 'numeric' },
      ].map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={f.placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={form[f.key]}
            onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
            keyboardType={f.keyboardType || 'default'}
          />
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Bio / Apresentação</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Fale sobre sua experiência e método de trabalho..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={form.bio}
          onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
          multiline
          numberOfLines={4}
        />
      </View>

      <Text style={styles.fieldLabel}>Especialidades</Text>
      <View style={styles.specialties}>
        {SPECIALTIES_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.specialtyBtn, form.specialties.includes(s) && styles.specialtyBtnActive]}
            onPress={() => toggleSpecialty(s)}
          >
            <Text style={[styles.specialtyText, form.specialties.includes(s) && styles.specialtyTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Interesse em plantões</Text>
          <Text style={styles.switchHint}>Atender clientes que chegam sem personal</Text>
        </View>
        <Switch
          value={form.interested_in_plantao}
          onValueChange={(v) => setForm((f) => ({ ...f, interested_in_plantao: v }))}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#f7941d' }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.docRow}>
        <View>
          <Text style={styles.switchLabel}>Comprovante CREF</Text>
          <Text style={styles.switchHint}>{form.document_url ? '✓ Enviado' : 'PDF ou imagem'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.docBtn, form.document_url && styles.docBtnDone]}
          onPress={pickDocument}
          disabled={uploadingDoc}
        >
          <Text style={styles.docBtnText}>
            {uploadingDoc ? 'Enviando...' : form.document_url ? 'Substituir' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <GradientButton
        style={[styles.submitBtn, (!form.full_name || !form.cref || submit.isPending) && styles.submitBtnDisabled]}
        contentStyle={styles.submitBtnContent}
        onPress={() => submit.mutate()}
        disabled={!form.full_name || !form.cref || submit.isPending}
      >
        {submit.isPending ? 'Enviando...' : 'Enviar Cadastro'}
      </GradientButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 40 },
  centerScreen: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(247,148,29,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  centerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  primaryBtn: { paddingHorizontal: 24 },
  backBtn: { alignSelf: 'flex-start', padding: 8, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#fff', marginBottom: 20 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  photo: { width: 80, height: 80, borderRadius: 16 },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  uploadLink: { color: '#f7941d', fontSize: 14, fontWeight: '500' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#fff', marginBottom: 6 },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  specialtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  specialtyBtnActive: { backgroundColor: '#f89b14', borderColor: 'transparent', borderRadius: 14 },
  specialtyText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  specialtyTextActive: { color: '#1a1a1a' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  switchHint: { fontSize: 12, color: '#fff', marginTop: 4 },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 24,
  },
  docBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(247,148,29,0.2)' },
  docBtnDone: { backgroundColor: 'rgba(34,197,94,0.2)' },
  docBtnText: { fontSize: 12, fontWeight: '600', color: '#f7941d' },
  submitBtn: {},
  submitBtnContent: { paddingVertical: 16, borderRadius: 16 },
  submitBtnDisabled: { opacity: 0.3 },
});
