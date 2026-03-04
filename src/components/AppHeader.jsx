import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { OrBoxLogoFull } from '../components/OrBoxLogo';

const ACCENT = '#F5A623';
const HEADER_HEIGHT = 56;
const TAB_BAR_HEIGHT = 56;

export default function AppHeader({ isAdmin }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;
  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;

  const activeTab = useNavigationState((state) => {
    if (!state?.routes?.[state.index]) return null;
    return state.routes[state.index].name;
  });

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout(false);
    let root = navigation;
    while (root.getParent()) root = root.getParent();
    root.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const openAdmin = () => {
    setMenuVisible(false);
    navigation.navigate(isAdmin ? 'Main' : 'Admin');
  };

  const menuItems = [
    { key: 'Profile', label: 'Perfil', icon: 'person-outline', route: 'Profile', activeWhen: 'Profile' },
    { key: 'Home', label: 'Home', icon: 'home-outline', route: 'Main', screen: 'Home', activeWhen: 'Home' },
    { key: 'Mapa', label: 'Mapa', icon: 'map-outline', route: 'Main', screen: 'ExploreMap', activeWhen: 'ExploreMap' },
    { key: 'Reservas', label: 'Reservas', icon: 'calendar-outline', route: 'Main', screen: 'MyBookings', activeWhen: 'MyBookings' },
    { key: 'Personais', label: 'Personais', icon: 'barbell-outline', route: 'Main', screen: 'Personais', activeWhen: 'Personais' },
    { key: 'Histórico', label: 'Histórico', icon: 'time-outline', route: 'Main', screen: 'History', activeWhen: 'History' },
    { key: 'Suporte', label: 'Suporte', icon: 'headset-outline', route: 'Main', screen: 'Support', activeWhen: 'Support' },
  ];

  const onMenuPress = (item) => {
    setMenuVisible(false);
    if (item.screen) {
      navigation.navigate(item.route, { screen: item.screen });
    } else {
      navigation.navigate(item.route);
    }
  };

  const goToProfile = () => {
    let root = navigation;
    while (root.getParent()) root = root.getParent();
    root.navigate('Profile');
  };

  const userIsAdmin = user?.role === 'admin';
  const displayName = user?.name || user?.full_name || user?.email || '';
  const initial = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : '?';
  const photoUrl = user?.photo_url;

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <OrBoxLogoFull height={32} />
        </TouchableOpacity>
        {user && (
          <View style={styles.headerRight}>
            {!userIsAdmin && (
              <TouchableOpacity onPress={goToProfile} style={styles.pfpBtn} activeOpacity={0.8}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.pfpImage} />
                ) : (
                  <View style={styles.pfpPlaceholder}>
                    <Text style={styles.pfpInitial}>{initial}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setMenuVisible(!menuVisible)}
              style={styles.menuBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={menuVisible ? 'close' : 'menu'}
                size={26}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable
            style={[styles.menuHeaderStrip, { height: headerTotalHeight }]}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuMiddleRow}>
            <Pressable
              style={styles.menuBackdropTouchable}
              onPress={() => setMenuVisible(false)}
            />
            <View style={[styles.menuPanel, { paddingBottom: 16 + insets.bottom }]}>
              {menuItems.map((item) => {
              const isActive = activeTab === item.activeWhen;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => onMenuPress(item)}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? ACCENT : 'rgba(255,255,255,0.9)'}
                  />
                  <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {user?.role === 'admin' && (
              <TouchableOpacity style={styles.menuItem} onPress={openAdmin}>
                <Ionicons name="shield-outline" size={22} color="rgba(255,255,255,0.9)" />
                <Text style={styles.menuItemText}>{isAdmin ? 'Ir para App' : 'Painel Admin'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.menuItem, styles.menuItemSair]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#f87171" />
              <Text style={styles.menuItemTextSair}>Sair</Text>
            </TouchableOpacity>
          </View>
          </View>
          <View style={[styles.menuTabBarStrip, { height: tabBarTotalHeight }]} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pfpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  pfpImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pfpPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,166,35,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pfpInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  menuBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  menuBackdrop: {
    flex: 1,
    flexDirection: 'column',
  },
  menuHeaderStrip: {
    backgroundColor: 'transparent',
  },
  menuMiddleRow: {
    flex: 1,
    flexDirection: 'row',
  },
  menuBackdropTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuPanel: {
    width: 280,
    alignSelf: 'stretch',
    backgroundColor: '#0d0d0d',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  menuTabBarStrip: {
    backgroundColor: 'transparent',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: 'rgba(245,166,35,0.18)',
  },
  menuItemText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: ACCENT,
    fontWeight: '600',
  },
  menuItemSair: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: 12,
    marginHorizontal: 4,
  },
  menuItemTextSair: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '500',
  },
});
