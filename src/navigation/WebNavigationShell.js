import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// Import our original screens
import StudentHubScreen from '../screens/main/StudentHubScreen';
import LecturerHubScreen from '../screens/main/LecturerHubScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import CampusMapScreen from '../screens/main/CampusMapScreen';
import InsightsScreen from '../screens/main/InsightsScreen';
import { useAuth } from '../context/AuthContext';

function CustomSidebar({ state, descriptors, navigation }) {
  const { user, logout } = useAuth();
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();
  
  const navItems = [
    { id: 'Hub', icon: 'home-outline', activeIcon: 'home' },
    { id: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { id: 'Map', icon: 'map-outline', activeIcon: 'map' },
    { id: 'Insights', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <View style={styles.branding}>
        <Text style={[styles.brandText, { color: colors.primary }]}>Olmies</Text>
      </View>

      <ScrollView style={styles.navContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const itemConfig = navItems.find(item => item.id === route.name) || { icon: 'ellipse-outline', activeIcon: 'ellipse' };
          
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

      {user && (
        <TouchableOpacity 
            style={[styles.logoutButton, { borderTopColor: colors.border, marginTop: 0 }]} 
            onPress={logout}
        >
           <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} style={{ marginRight: 15 }} />
           <Text style={[styles.navText, { color: colors.textSecondary }]}>Logout</Text>
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
        screenOptions={{ headerShown: false }}
        sceneContainerStyle={{ backgroundColor: colors.background, marginLeft: 250 }}
      >
        <Tab.Screen name="Hub" component={isLecturer ? LecturerHubScreen : StudentHubScreen} />
        <Tab.Screen name="Alerts" component={AlertsScreen} />
        <Tab.Screen name="Map" component={CampusMapScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    paddingVertical: 30,
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  branding: {
    paddingHorizontal: 25,
    marginBottom: 40,
  },
  brandText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
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
    paddingHorizontal: 25,
    marginTop: 20,
    borderTopWidth: 1,
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden'
  }
});
