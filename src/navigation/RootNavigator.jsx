import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import AdminDrawer from './AdminDrawer';
import LoadingScreen from '../screens/LoadingScreen';
import UserNotRegisteredScreen from '../screens/UserNotRegisteredScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import BookBoxScreen from '../screens/BookBoxScreen';
import BookingConfirmedScreen from '../screens/BookingConfirmedScreen';
import BoxSessionScreen from '../screens/BoxSessionScreen';
import PersonalProfileScreen from '../screens/PersonalProfileScreen';
import PersonalRegisterScreen from '../screens/PersonalRegisterScreen';
import PersonalDashboardScreen from '../screens/PersonalDashboardScreen';
import PageNotFoundScreen from '../screens/PageNotFoundScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, user } = useAuth();

  const profileComplete = user?.profile_complete !== false;

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'rgba(10,10,10,0.95)' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !profileComplete ? (
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={CompleteProfileScreen} />
            <Stack.Screen name="Admin" component={AdminDrawer} />
            <Stack.Screen name="BookBox" component={BookBoxScreen} />
            <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} />
            <Stack.Screen name="BoxSession" component={BoxSessionScreen} />
            <Stack.Screen name="PersonalProfile" component={PersonalProfileScreen} />
            <Stack.Screen name="PersonalRegister" component={PersonalRegisterScreen} />
            <Stack.Screen name="PersonalDashboard" component={PersonalDashboardScreen} />
            <Stack.Screen name="PageNotFound" component={PageNotFoundScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
