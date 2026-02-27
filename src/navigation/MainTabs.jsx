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
  Home: 'home',
  ExploreMap: 'map',
  MyBookings: 'calendar',
  Personais: 'barbell',
  History: 'time',
  Support: 'headset',
};

export default function MainTabs() {
  return (
    <View style={styles.container}>
      <AppHeader isAdmin={false} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={tabIcons[route.name] || 'ellipse'} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#F5A623',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  tabBar: {
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
  },
});
