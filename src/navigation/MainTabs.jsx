import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import HomeScreen from '../screens/HomeScreen';
import ExploreMapScreen from '../screens/ExploreMapScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import PersonaisScreen from '../screens/PersonaisScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SupportScreen from '../screens/SupportScreen';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: 'home-outline',
  ExploreMap: 'location-outline',
  MyBookings: 'calendar-outline',
  Personais: 'barbell-outline',
  History: 'time-outline',
  Support: 'headset-outline',
};

export default function MainTabs() {
  return (
    <View style={styles.container}>
      <AppHeader isAdmin={false} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={tabIcons[route.name] || 'ellipse-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#f7941d',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="ExploreMap" component={ExploreMapScreen} options={{ tabBarLabel: 'Mapa' }} />
        <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ tabBarLabel: 'Reservas' }} />
        <Tab.Screen name="Personais" component={PersonaisScreen} options={{ tabBarLabel: 'Personais' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Histórico' }} />
        <Tab.Screen name="Support" component={SupportScreen} options={{ tabBarLabel: 'Suporte' }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10,10,10,0.95)' },
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    height: 58,
    paddingBottom: 8,
    paddingTop: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,20,0.92)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
});
