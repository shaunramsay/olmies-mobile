import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const UTECH_CREST = require('../../assets/utech-crest.png');

// Import our original screens
import StudentHubScreen from '../screens/main/StudentHubScreen';
import LecturerHubScreen from '../screens/main/LecturerHubScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import CampusMapScreen from '../screens/main/CampusMapScreen';
import SurveysScreen from '../screens/main/SurveysScreen';
import AskUTechScreen from '../screens/helpdesk/AskUTechScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import InsightsScreen from '../screens/main/InsightsScreen';
import { useAuth } from '../context/AuthContext';

function CustomSidebar({ state, descriptors, navigation }) {
  const { user, logout } = useAuth();
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();
  
  const navItems = [
    { id: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'Help Desk', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
    { id: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { id: 'Map', icon: 'map-outline', activeIcon: 'map' },
    { id: 'Surveys', icon: 'clipboard-outline', activeIcon: 'clipboard' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.branding}>
        <View style={[styles.brandBadge, { borderColor: colors.border }]}>
          <Image source={UTECH_CREST} style={styles.brandLogo} resizeMode="contain" />
        </View>
      </View>

      <ScrollView style={styles.navContainer}>
        {navItems.map(itemConfig => {
          const index = state.routes.findIndex(route => route.name === itemConfig.id);
          if (index === -1) return null;

          const route = state.routes[index];
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TouchableOpacity 
              key={route.key} 
              style={[
                  styles.navItem, 
                  isFocused && { backgroundColor: `${colors.primary}1A`, borderRightWidth: 3, borderRightColor: colors.primary }
              ]}
              onPress={onPress}
            >
              <Ionicons 
                name={isFocused ? itemConfig.activeIcon : itemConfig.icon} 
                size={24} 
                color={isFocused ? colors.primary : colors.textSecondary} 
                style={{ marginRight: 15 }}
              />
              <Text style={[styles.navText, { color: isFocused ? colors.text : colors.textSecondary }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.logoutButton, { borderTopColor: colors.border }]} 
        onPress={toggleTheme}
      >
         <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={24} color={colors.textSecondary} style={{ marginRight: 15 }} />
         <Text style={[styles.navText, { color: colors.textSecondary }]}>Toggle Theme</Text>
      </TouchableOpacity>

      {user ? (
        <TouchableOpacity 
            style={[styles.logoutButton, { borderTopColor: colors.border, marginTop: 0 }]} 
            onPress={logout}
        >
           <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} style={{ marginRight: 15 }} />
           <Text style={[styles.navText, { color: colors.textSecondary }]}>Logout</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
            style={[styles.logoutButton, { borderTopColor: colors.border, marginTop: 0 }]} 
            onPress={() => navigation.navigate('Login')}
        >
           <Ionicons name="log-in-outline" size={24} color={colors.textSecondary} style={{ marginRight: 15 }} />
           <Text style={[styles.navText, { color: colors.textSecondary }]}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function WebNavigationShell() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const isLecturer = Array.isArray(user?.role) 
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Tab.Navigator
        tabBar={props => <CustomSidebar {...props} />}
        screenOptions={{ 
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background, marginLeft: 190 }
        }}
      >
        <Tab.Screen name="Home">
          {(props) => (
            <View style={{ flex: 1 }}>
              {isLecturer ? <LecturerHubScreen {...props} /> : <StudentHubScreen {...props} />}
            </View>
          )}
        </Tab.Screen>
        <Tab.Screen name="Help Desk">
          {(props) => <View style={{ flex: 1 }}><AskUTechScreen {...props} /></View>}
        </Tab.Screen>
        <Tab.Screen name="Alerts">
          {(props) => <View style={{ flex: 1 }}><AlertsScreen {...props} /></View>}
        </Tab.Screen>
        <Tab.Screen name="Map">
          {(props) => <View style={{ flex: 1 }}><CampusMapScreen {...props} /></View>}
        </Tab.Screen>
        <Tab.Screen name="Surveys">
          {(props) => <View style={{ flex: 1 }}><SurveysScreen {...props} /></View>}
        </Tab.Screen>
        <Tab.Screen name="History">
          {(props) => <View style={{ flex: 1 }}><HistoryScreen {...props} /></View>}
        </Tab.Screen>
        <Tab.Screen name="Insights">
          {(props) => <View style={{ flex: 1 }}><InsightsScreen {...props} /></View>}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    width: 190,
    borderRightWidth: 1,
    paddingVertical: 30,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  branding: {
    paddingHorizontal: 22,
    marginBottom: 34,
  },
  brandBadge: {
    width: 76,
    height: 86,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 22,
    marginBottom: 5,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 22,
    marginTop: 20,
    borderTopWidth: 1,
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden'
  }
});
