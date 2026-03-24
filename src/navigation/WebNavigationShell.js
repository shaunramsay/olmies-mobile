import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

// Import our original screens
import StudentHubScreen from '../screens/main/StudentHubScreen';
import LecturerHubScreen from '../screens/main/LecturerHubScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import CampusMapScreen from '../screens/main/CampusMapScreen';
import InsightsScreen from '../screens/main/InsightsScreen';
import { useAuth } from '../context/AuthContext';

export default function WebNavigationShell({ navigation }) {
  const [activeTab, setActiveTab] = useState('Hub');
  const { user, logout } = useAuth();
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();

  const isLecturer = user?.role?.toLowerCase() === 'lecturer';

  const renderContent = () => {
    switch (activeTab) {
      case 'Hub': return isLecturer ? <LecturerHubScreen navigation={navigation} /> : <StudentHubScreen navigation={navigation} />;
      case 'Alerts': return <AlertsScreen navigation={navigation} />;
      case 'Map': return <CampusMapScreen navigation={navigation} />;
      case 'Insights': return <InsightsScreen navigation={navigation} />;
      default: return isLecturer ? <LecturerHubScreen navigation={navigation} /> : <StudentHubScreen navigation={navigation} />;
    }
  };

  const navItems = [
    { id: 'Hub', icon: 'home-outline', activeIcon: 'home' },
    { id: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { id: 'Map', icon: 'map-outline', activeIcon: 'map' },
    { id: 'Insights', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Web Sidebar Navigation */}
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <View style={styles.branding}>
          <Text style={[styles.brandText, { color: colors.primary }]}>Olmies</Text>
        </View>

        <ScrollView style={styles.navContainer}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.navItem, 
                  isActive && { backgroundColor: `${colors.primary}1A`, borderRightWidth: 3, borderRightColor: colors.primary }
                ]}
                onPress={() => setActiveTab(item.id)}
              >
                <Ionicons 
                  name={isActive ? item.activeIcon : item.icon} 
                  size={24} 
                  color={isActive ? colors.primary : colors.textSecondary} 
                  style={{ marginRight: 15 }}
                />
                <Text style={[styles.navText, { color: isActive ? colors.text : colors.textSecondary }]}>
                  {item.id}
                </Text>
              </TouchableOpacity>
            )
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

      {/* Main Content Area */}
      <SafeAreaView style={[styles.contentArea, { backgroundColor: colors.background }]}>
         {renderContent()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    paddingVertical: 30,
    display: 'flex',
    flexDirection: 'column',
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
