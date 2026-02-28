import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

const categoryLabels = {
  access: 'Acesso',
  payment: 'Pagamento',
  equipment: 'Equipamento',
  general: 'Geral',
};

export default function SupportScreen() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', user?.email],
    queryFn: () => api.entities.SupportTicket.filter({ user_email: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const createTicket = useMutation({
    mutationFn: (data) => api.entities.SupportTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowForm(false);
      setSubject('');
      setMessage('');
      setCategory('general');
    },
    onError: (err) => {
      const msg = err?.data?.message ?? err?.message ?? 'Falha ao enviar. Tente novamente.';
      Alert.alert('Erro', msg);
    },
  });

  const handleSubmit = () => {
    if (!subject || !message) return;
    if (!user) return;
    createTicket.mutate({
      user_email: user.email,
      user_name: user.full_name ?? user.name,
      subject,
      message,
      category,
    });
  };

  const categories = [
    { key: 'general', label: 'Geral' },
    { key: 'access', label: 'Acesso' },
    { key: 'payment', label: 'Pagamento' },
    { key: 'equipment', label: 'Equipamento' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Suporte</Text>
        <TouchableOpacity
          style={styles.newTicketBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text style={styles.newTicketBtnText}>Novo Ticket</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickHelp}>
        {[
          { icon: 'help-circle', label: 'FAQ', desc: 'Perguntas frequentes' },
          { icon: 'call', label: 'Telefone', desc: '(11) 9999-9999' },
          { icon: 'mail', label: 'Email', desc: 'suporte@orbox.com' },
        ].map((item, i) => (
          <View key={i} style={styles.quickCard}>
            <View style={styles.quickIcon}>
              <Ionicons name={item.icon} size={20} color="rgba(255,255,255,0.4)" />
            </View>
            <View>
              <Text style={styles.quickLabel}>{item.label}</Text>
              <Text style={styles.quickDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {showForm && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Novo Ticket de Suporte</Text>
            <View style={styles.categoryRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.categoryBtn, category === c.key && styles.categoryBtnActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.categoryText, category === c.key && styles.categoryTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Assunto"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={subject}
              onChangeText={setSubject}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva seu problema..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
            {createTicket.isError && (
              <Text style={styles.formError}>
                {createTicket.error?.data?.message ?? createTicket.error?.message ?? 'Falha ao enviar.'}
              </Text>
            )}
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)} disabled={createTicket.isPending}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!subject || !message || !user || createTicket.isPending) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!subject || !message || !user || createTicket.isPending}
              >
                <Ionicons name="send" size={16} color="#000" />
                <Text style={styles.submitBtnText}>{createTicket.isPending ? 'Enviando…' : 'Enviar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {tickets.length === 0 && !showForm ? (
        <EmptyState
          iconName="chatbubbles"
          title="Nenhum ticket"
          description="Crie um ticket se precisar de ajuda"
        />
      ) : (
        <View style={styles.ticketList}>
          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <StatusBadge status={ticket.status} />
              </View>
              <Text style={styles.ticketMeta}>
                {categoryLabels[ticket.category]} ·{' '}
                {format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm')}
              </Text>
              <Text style={styles.ticketMessage}>{ticket.message}</Text>
              {ticket.response && (
                <View style={styles.responseBox}>
                  <Text style={styles.responseLabel}>Resposta do suporte</Text>
                  <Text style={styles.responseText}>{ticket.response}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5A623',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newTicketBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  quickHelp: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  quickCard: {
    width: '95%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  quickDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  form: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryBtnActive: { backgroundColor: '#F5A623', borderColor: 'transparent' },
  categoryText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  categoryTextActive: { color: '#000', fontWeight: '600' },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  formError: { color: '#f87171', fontSize: 14, marginBottom: 8 },
  formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5A623', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#000', fontWeight: '700' },
  ticketList: { gap: 12 },
  ticketCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ticketSubject: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  ticketMeta: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  ticketMessage: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  responseBox: {
    marginTop: 12,
    backgroundColor: 'rgba(245,166,35,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  responseLabel: { fontSize: 12, color: 'rgba(245,166,35,0.6)', fontWeight: '600', marginBottom: 4 },
  responseText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
});
