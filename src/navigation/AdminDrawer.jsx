import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminBoxesScreen from '../screens/AdminBoxesScreen';
import AdminBookingsScreen from '../screens/AdminBookingsScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminPersonaisScreen from '../screens/AdminPersonaisScreen';
import AdminFinancialScreen from '../screens/AdminFinancialScreen';
import AdminSupportTicketsScreen from '../screens/AdminSupportTicketsScreen';

const Drawer = createDrawerNavigator();

const adminScreens = [
  { name: 'AdminDashboard', component: AdminDashboardScreen, label: 'Dashboard', icon: 'grid' },
  { name: 'AdminBoxes', component: AdminBoxesScreen, label: 'Boxes', icon: 'cube' },
  { name: 'AdminBookings', component: AdminBookingsScreen, label: 'Reservas', icon: 'calendar' },
  { name: 'AdminUsers', component: AdminUsersScreen, label: 'Usuários', icon: 'people' },
  { name: 'AdminPersonais', component: AdminPersonaisScreen, label: 'Personais', icon: 'barbell' },
  { name: 'AdminFinancial', component: AdminFinancialScreen, label: 'Financeiro', icon: 'bar-chart' },
  { name: 'AdminSupportTickets', component: AdminSupportTicketsScreen, label: 'Tickets de Suporte', icon: 'ticket' },
];

export default function AdminDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        header: () => <AppHeader isAdmin />,
        drawerStyle: { backgroundColor: '#0d0d0d', width: 220 },
        drawerActiveTintColor: '#F5A623',
        drawerInactiveTintColor: 'rgba(255,255,255,0.5)',
        drawerLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      {adminScreens.map(({ name, component, label, icon }) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={component}
          options={{
            drawerLabel: label,
            drawerIcon: ({ focused, color, size }) => (
              <Ionicons name={icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Drawer.Navigator>
  );
}
