import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { OrBoxLogoFull } from '../components/OrBoxLogo';
import { formatCpf, cpfDigits } from '../lib/cpf';

export default function SignupScreen() {
  const navigation = useNavigation();
  const { setUserFromAuth } = useAuth();
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCpfChange = (text) => {
    setCpf(formatCpf(text));
  };

  const handleSubmit = async () => {
    setError('');
    const cpfOnly = cpfDigits(cpf);
    if (cpfOnly.length !== 11) {
      setError('Informe um CPF válido (11 dígitos).');
      return;
    }
    if (!phone.trim()) {
      setError('Informe o telefone.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Telefone deve ter pelo menos 10 dígitos.');
      return;
    }
    if (!email.trim()) {
      setError('Informe o e-mail.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.signup(
        cpfOnly,
        phone.trim(),
        email.trim(),
        password,
        fullName.trim() || undefined
      );
      setUserFromAuth(user);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err?.data?.message || err?.message || 'Falha ao criar conta. Verifique os dados.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <OrBoxLogoFull height={40} />
        </View>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>CPF, telefone e e-mail para autenticação</Text>
        <View style={styles.form}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={cpf}
            onChangeText={handleCpfChange}
            keyboardType="numeric"
            maxLength={14}
          />
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Text style={styles.label}>Senha (mín. 6 caracteres)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Text style={styles.label}>Nome completo (opcional – pode preencher depois)</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Criando conta…' : 'Criar conta'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Já tem conta? </Text>
          <Text style={styles.linkAccent}>Entrar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  logoWrap: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 },
  form: { width: '100%', maxWidth: 340 },
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
  error: { color: '#f87171', fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  linkWrap: { flexDirection: 'row', marginTop: 24 },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  linkAccent: { color: '#F5A623', fontSize: 14, fontWeight: '600' },
});
