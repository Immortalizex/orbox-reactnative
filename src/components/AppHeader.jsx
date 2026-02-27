import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { OrBoxLogoFull } from '../components/OrBoxLogo';

export default function AppHeader({ isAdmin }) {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout(false);
    let root = navigation;
    while (root.getParent()) root = root.getParent();
    root.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Main')}>
        <OrBoxLogoFull height={32} />
      </TouchableOpacity>
      <View style={styles.rightRow}>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.adminBadge}
            onPress={() => navigation.navigate(isAdmin ? 'Main' : 'Admin')}
          >
            <Text style={styles.adminBadgeText}>{isAdmin ? 'App' : 'Admin'}</Text>
          </TouchableOpacity>
        )}
        {user && (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  adminBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(245,166,35,0.2)',
  },
  adminBadgeText: { color: '#F5A623', fontSize: 12, fontWeight: '600' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  logoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
});
