import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Main Tab Navigator Imports
import StudentHubScreen from '../screens/main/StudentHubScreen';
import LecturerHubScreen from '../screens/main/LecturerHubScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { fonts } from '../utils/theme';

import AlertsScreen from '../screens/main/AlertsScreen';
import MapScreen from '../screens/main/CampusMapScreen';
import SurveysScreen from '../screens/main/SurveysScreen';
import AskUTechScreen from '../screens/helpdesk/AskUTechScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const isLecturer = Array.isArray(user?.role)
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          height: 60 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginTop: 4, fontFamily: fonts.semiBold },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Help Desk') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
          if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'Surveys') iconName = focused ? 'clipboard' : 'clipboard-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={isLecturer ? LecturerHubScreen : StudentHubScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Help Desk" component={AskUTechScreen} options={{ title: 'Help Desk' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="Surveys" component={SurveysScreen} options={{ title: 'Surveys' }} />
    </Tab.Navigator>
  );
}
