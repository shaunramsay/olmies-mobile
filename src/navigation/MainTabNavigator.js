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
import InsightsScreen from '../screens/main/InsightsScreen';
import HistoryScreen from '../screens/main/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { user } = useAuth();
  const isLecturer = user?.role?.toLowerCase() === 'lecturer';
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
        tabBarLabelStyle: { fontSize: 12, marginTop: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Hub') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
          if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'Insights') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Hub" 
        component={isLecturer ? LecturerHubScreen : StudentHubScreen} 
        options={{ title: 'Hub' }} 
      />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
    </Tab.Navigator>
  );
}
