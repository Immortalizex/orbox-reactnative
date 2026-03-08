import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  useWindowDimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { OrBoxLogoFull } from '../components/OrBoxLogo';

const ACCENT = '#f7941d';
const SIDEBAR_BG = '#1A1A1A';
const SIDEBAR_SELECTED_BG = 'rgba(245, 165, 35, 0.18)';
const SIDEBAR_INACTIVE = '#CCCCCC';
const SIDEBAR_LOGOUT = '#F44336';

// Shared layout constants (used for sidebar positioning and by layout logic)
export const HEADER_HEIGHT = 56;
export const TAB_BAR_HEIGHT = 56;
const SIDEBAR_WIDTH = 240;

export default function AppHeader({ isAdmin, hasHeader = true }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  const headerTotalHeight = hasHeader ? insets.top + HEADER_HEIGHT : 0;
  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Layout mode: isAdmin = false → Main (header + bottom nav), sidebar between them.
  // isAdmin = true → Admin (header only, no bottom nav), sidebar from below header to bottom.
  // hasHeader = false → drawer full screen vertically (e.g. layout without header).
  const sidebarTop = headerTotalHeight;
  const sidebarBottom = isAdmin ? 0 : tabBarTotalHeight;
  const sidebarHeight = windowHeight - sidebarTop - sidebarBottom;

  useEffect(() => {
    if (menuVisible) {
      slideAnim.setValue(SIDEBAR_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [menuVisible, slideAnim]);

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const currentPage = useNavigationState((state) => {
    if (!state?.routes?.[state.index]) return 'Home';
    const route = state.routes[state.index];
    if (route.name === 'Main') {
      if (route.state?.routes != null && route.state?.index != null) {
        const tabRoute = route.state.routes[route.state.index];
        return tabRoute?.name ?? 'Home';
      }
      return 'Home';
    }
    return route.name;
  });

  const handleLogout = async () => {
    closeMenu();
    await logout(false);
    let root = navigation;
    while (root.getParent()) root = root.getParent();
    root.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const openAdmin = () => {
    closeMenu();
    navigation.navigate(isAdmin ? 'Main' : 'Admin');
  };

  const menuItems = [
    { key: 'Profile', label: 'Perfil', icon: 'person-outline', route: 'Profile', activeWhen: 'Profile' },
    { key: 'Home', label: 'Home', icon: 'home-outline', route: 'Main', screen: 'Home', activeWhen: 'Home' },
    { key: 'Mapa', label: 'Mapa', icon: 'location-outline', route: 'Main', screen: 'ExploreMap', activeWhen: 'ExploreMap' },
    { key: 'Reservas', label: 'Reservas', icon: 'calendar-outline', route: 'Main', screen: 'MyBookings', activeWhen: 'MyBookings' },
    { key: 'Personais', label: 'Personais', icon: 'barbell-outline', route: 'Main', screen: 'Personais', activeWhen: 'Personais' },
    { key: 'Histórico', label: 'Histórico', icon: 'time-outline', route: 'Main', screen: 'History', activeWhen: 'History' },
    { key: 'Suporte', label: 'Suporte', icon: 'headset-outline', route: 'Main', screen: 'Support', activeWhen: 'Support' },
  ];

  const onMenuPress = (item) => {
    closeMenu();
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
            {userIsAdmin && (
              <TouchableOpacity
                onPress={() => navigation.navigate(isAdmin ? 'Main' : 'Admin')}
                style={styles.adminBtn}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isAdmin ? 'phone-portrait-outline' : 'shield'}
                  size={14}
                  color={ACCENT}
                />
                <Text style={styles.adminBtnText}>{isAdmin ? 'APP' : 'Admin'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => (menuVisible ? closeMenu() : setMenuVisible(true))}
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
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View
          style={[
            styles.menuBackdrop,
            {
              width: windowWidth,
              height: windowHeight,
              top: 0,
              left: 0,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Tappable strip over header area so X button tap closes the menu (modal is on top) */}
          {sidebarTop > 0 && (
            <Pressable
              style={[styles.menuHeaderStrip, { height: sidebarTop }]}
              onPress={closeMenu}
            />
          )}
          {/* Overlay: only covers content area between header and (on normal) tab bar */}
          <Pressable
            style={[
              styles.menuOverlay,
              {
                top: sidebarTop,
                left: 0,
                right: 0,
                bottom: sidebarBottom,
              },
            ]}
            onPress={closeMenu}
          />
          {/* Sidebar: pinned between header and tab bar (or full below header on admin) */}
          <Animated.View
            style={[
              styles.menuPanelWrap,
              {
                top: sidebarTop,
                bottom: sidebarBottom,
                width: SIDEBAR_WIDTH,
                height: undefined,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <ScrollView
              style={styles.menuPanelScroll}
              contentContainerStyle={[styles.menuPanel, { paddingBottom: 16 + (isAdmin ? 0 : insets.bottom) }]}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => {
                const isActive = currentPage === item.activeWhen;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => onMenuPress(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isActive ? ACCENT : SIDEBAR_INACTIVE}
                    />
                    <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.menuItem} onPress={openAdmin} activeOpacity={0.7}>
                  <Ionicons name="shield-outline" size={22} color={SIDEBAR_INACTIVE} />
                  <Text style={styles.menuItemText}>{isAdmin ? 'Ir para App' : 'Painel Admin'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.menuItem, styles.menuItemSair]} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={22} color={SIDEBAR_LOGOUT} />
                <Text style={styles.menuItemTextSair}>Sair</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
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
    backgroundColor: 'rgba(247,148,29,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pfpInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(90,70,50,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(247,148,29,0.25)',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adminBtnText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '600',
  },
  menuBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  menuBackdrop: {
    position: 'absolute',
    flex: 1,
  },
  menuHeaderStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  menuOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuPanelWrap: {
    position: 'absolute',
    right: 0,
    backgroundColor: SIDEBAR_BG,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
    zIndex: 1,
  },
  menuPanelScroll: {
    flex: 1,
  },
  menuPanel: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginBottom: 4,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: SIDEBAR_SELECTED_BG,
  },
  menuItemText: {
    color: SIDEBAR_INACTIVE,
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: ACCENT,
    fontWeight: '600',
  },
  menuItemSair: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    marginBottom: 0,
    marginHorizontal: 4,
  },
  menuItemTextSair: {
    color: SIDEBAR_LOGOUT,
    fontSize: 14,
    fontWeight: '500',
  },
});
