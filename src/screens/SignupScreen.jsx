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

export default function SignupScreen() {
  const navigation = useNavigation();
  const { setUserFromAuth } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.auth.signup(email.trim(), password, fullName.trim());
      setUserFromAuth(user);
      setLoading(false);
      // RootNavigator switches to Main when isAuthenticated becomes true
    } catch (err) {
      setLoading(false);
      setError(err?.data?.message || err?.message || 'Falha ao criar conta. Tente outro e-mail.');
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
        <View style={styles.form}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
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
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 24 },
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
