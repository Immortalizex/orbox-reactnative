import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function AdminUsersScreen() {
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.entities.User.list('-created_date', 500),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Usuários</Text>
      {users.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.full_name || u.email}</Text>
          <Text style={styles.email}>{u.email}</Text>
          {u.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{u.role}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  roleBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(247,148,29,0.2)' },
  roleText: { fontSize: 12, color: '#f7941d', fontWeight: '600' },
});
