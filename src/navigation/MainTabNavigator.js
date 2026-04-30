import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Main Tab Navigator Imports
import StudentHubScreen from '../screens/main/StudentHubScreen';
import LecturerHubScreen from '../screens/main/LecturerHubScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

import AlertsScreen from '../screens/main/AlertsScreen';
import MapScreen from '../screens/main/CampusMapScreen';
import SurveysScreen from '../screens/main/SurveysScreen';
import AskUTechScreen from '../screens/helpdesk/AskUTechScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { user } = useAuth();
  const isLecturer = Array.isArray(user?.role) 
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          height: 60 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#333',
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: { fontSize: 11, marginTop: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Help Desk') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
          if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'Surveys') iconName = focused ? 'clipboard' : 'clipboard-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
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
