import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

const categoryLabels = {
  access: 'Acesso',
  payment: 'Pagamento',
  equipment: 'Equipamento',
  general: 'Geral',
};

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
];

const categoryOptions = [
  { value: '', label: 'Todas' },
  { value: 'general', label: 'Geral' },
  { value: 'access', label: 'Acesso' },
  { value: 'payment', label: 'Pagamento' },
  { value: 'equipment', label: 'Equipamento' },
];

const sortOptions = [
  { value: '-created_date', label: 'Mais recentes' },
  { value: 'created_date', label: 'Mais antigos' },
  { value: 'status', label: 'Status A–Z' },
  { value: '-status', label: 'Status Z–A' },
];

function FilterDropdown({ label, value, options, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : placeholder;

  return (
    <View style={dropdownStyles.wrap}>
      <Text style={dropdownStyles.label}>{label}</Text>
      <TouchableOpacity
        style={dropdownStyles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={dropdownStyles.triggerText} numberOfLines={1}>{display}</Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={dropdownStyles.modalOverlay} onPress={() => setOpen(false)}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={dropdownStyles.modalContent}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value || '_all'}
                style={[dropdownStyles.option, opt.value === value && dropdownStyles.optionActive]}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={[dropdownStyles.optionText, opt.value === value && dropdownStyles.optionTextActive]}>
                  {opt.label}
                </Text>
                {opt.value === value && <Ionicons name="checkmark" size={18} color="#F5A623" />}
              </TouchableOpacity>
            ))}
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: { fontSize: 14, color: '#fff', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  optionActive: { backgroundColor: 'rgba(245,166,35,0.1)' },
  optionText: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  optionTextActive: { color: '#F5A623', fontWeight: '600' },
});

export default function AdminSupportTicketsScreen() {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('-created_date');
  const [expandedId, setExpandedId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editResponse, setEditResponse] = useState('');
  const queryClient = useQueryClient();

  const filters = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
  };

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['adminSupportTickets', filters, sort],
    queryFn: () => api.entities.SupportTicket.adminList(filters, sort, 200),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }) => api.entities.SupportTicket.adminUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      setExpandedId(null);
      setEditStatus('');
      setEditResponse('');
    },
    onError: (err) => {
      const msg = err?.data?.message ?? err?.message ?? 'Falha ao atualizar.';
      Alert.alert('Erro', msg);
    },
  });

  const handleSaveTicket = (ticket) => {
    const id = ticket.id;
    const data = {};
    if (editStatus && editStatus !== ticket.status) data.status = editStatus;
    if (editResponse !== undefined && editResponse !== (ticket.response || '')) data.response = editResponse;
    if (Object.keys(data).length === 0) {
      setExpandedId(null);
      return;
    }
    updateTicket.mutate({ id, data });
  };

  const toggleExpand = (ticket) => {
    if (expandedId === ticket.id) {
      setExpandedId(null);
    } else {
      setExpandedId(ticket.id);
      setEditStatus(ticket.status);
      setEditResponse(ticket.response || '');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="ticket" size={20} color="#F5A623" />
        <Text style={styles.title}>Tickets de Suporte</Text>
      </View>

      <View style={styles.filtersSection}>
        <FilterDropdown
          label="Status"
          value={statusFilter}
          options={statusOptions}
          onSelect={setStatusFilter}
          placeholder="Todos"
        />
        <FilterDropdown
          label="Categoria"
          value={categoryFilter}
          options={categoryOptions}
          onSelect={setCategoryFilter}
          placeholder="Todas"
        />
        <FilterDropdown
          label="Ordenar"
          value={sort}
          options={sortOptions}
          onSelect={setSort}
          placeholder="Mais recentes"
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#F5A623" />
        </View>
      ) : tickets.length === 0 ? (
        <EmptyState
          iconName="chatbubbles-outline"
          title="Nenhum ticket"
          description="Não há tickets com os filtros selecionados"
        />
      ) : (
        <View style={styles.list}>
          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(ticket)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.subject} numberOfLines={1}>{ticket.subject}</Text>
                  <Text style={styles.meta}>
                    {ticket.user_name || ticket.user_email} · {categoryLabels[ticket.category] ?? ticket.category} ·{' '}
                    {format(new Date(ticket.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <StatusBadge status={ticket.status} />
                  <Ionicons
                    name={expandedId === ticket.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255,255,255,0.4)"
                  />
                </View>
              </TouchableOpacity>

              {expandedId === ticket.id && (
                <View style={styles.expanded}>
                  <Text style={styles.messageLabel}>Mensagem</Text>
                  <Text style={styles.message}>{ticket.message}</Text>

                  {ticket.response ? (
                    <>
                      <Text style={styles.responseLabel}>Resposta atual</Text>
                      <Text style={styles.responseText}>{ticket.response}</Text>
                    </>
                  ) : null}

                  <Text style={styles.editLabel}>Alterar status / resposta</Text>
                  <View style={styles.statusRow}>
                    {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, editStatus === s && styles.statusBtnActive]}
                        onPress={() => setEditStatus(s)}
                      >
                        <Text style={[styles.statusBtnText, editStatus === s && styles.statusBtnTextActive]}>
                          {statusOptions.find((o) => o.value === s)?.label || s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Resposta ao usuário..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={editResponse}
                    onChangeText={setEditResponse}
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setExpandedId(null); setEditStatus(''); setEditResponse(''); }}>
                      <Text style={styles.cancelBtnText}>Fechar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, updateTicket.isPending && styles.saveBtnDisabled]}
                      onPress={() => handleSaveTicket(ticket)}
                      disabled={updateTicket.isPending}
                    >
                      {updateTicket.isPending ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#000" />
                          <Text style={styles.saveBtnText}>Salvar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  filtersSection: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  loading: { padding: 40, alignItems: 'center' },
  list: { gap: 12 },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subject: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  expanded: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', padding: 16 },
  messageLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  responseLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  responseText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  editLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusBtnActive: { backgroundColor: '#F5A623', borderColor: 'transparent' },
  statusBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  statusBtnTextActive: { color: '#000', fontWeight: '600' },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5A623', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#000', fontWeight: '700' },
});
