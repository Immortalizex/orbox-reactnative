import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCpf } from '../lib/cpf';

const ACCENT = '#f7941d';

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, setUserFromAuth } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name?.trim() || user.full_name?.trim() || '');
      setPhone(user.phone?.trim() || '');
      setPhotoUrl(user.photo_url || '');
    }
  }, [user?.id, user?.name, user?.full_name, user?.phone, user?.photo_url]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const { file_url } = await api.integrations.Core.UploadFile({
        file: { uri: result.assets[0].uri, mimeType: 'image/jpeg', fileName: 'photo.jpg' },
      });
      setPhotoUrl(file_url);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Falha ao enviar foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const updated = await api.auth.updateProfile({
        name: trimmedName,
        phone: phone.trim() || undefined,
        photo_url: photoUrl || undefined,
      });
      setUserFromAuth(updated);
      setError('');
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Falha ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const email = user?.email ?? '';
  const cpf = user?.cpf ? formatCpf(user.cpf) : '';

  const canGoBack = navigation.canGoBack?.() ?? true;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>Meu perfil</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoSection}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                {(name || user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImage}
            disabled={uploadingPhoto}
          >
            <Text style={styles.uploadBtnText}>
              {uploadingPhoto ? 'Enviando…' : photoUrl ? 'Trocar foto' : 'Adicionar foto'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#fff"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={email}
            editable={false}
            placeholder="—"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <Text style={styles.hint}>E-mail não pode ser alterado aqui.</Text>

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#fff"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={cpf}
            editable={false}
            placeholder="—"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <Text style={styles.hint}>CPF não pode ser alterado.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSpacer: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(247,148,29,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  uploadBtn: { marginTop: 12 },
  uploadBtnText: { color: ACCENT, fontSize: 14, fontWeight: '600' },
  form: { width: '100%', maxWidth: 400 },
  label: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  inputReadOnly: {
    opacity: 0.85,
    color: 'rgba(255,255,255,0.7)',
  },
  hint: {
    fontSize: 12,
    color: '#fff',
    marginTop: -8,
    marginBottom: 16,
  },
  error: { color: '#f87171', fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
