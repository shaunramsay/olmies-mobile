import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    <View style={styles.container}>
      {/* Web Sidebar Navigation */}
      <View style={styles.sidebar}>
        <View style={styles.branding}>
          <Text style={styles.brandText}>Olmies</Text>
        </View>

        <ScrollView style={styles.navContainer}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => setActiveTab(item.id)}
              >
                <Ionicons 
                  name={isActive ? item.activeIcon : item.icon} 
                  size={24} 
                  color={isActive ? '#8A2BE2' : '#888'} 
                  style={{ marginRight: 15 }}
                />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.id}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
             <Ionicons name="log-out-outline" size={24} color="#888" style={{ marginRight: 15 }} />
             <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      <SafeAreaView style={styles.contentArea}>
         {renderContent()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0A0A0A'
  },
  sidebar: {
    width: 250,
    backgroundColor: '#161616',
    borderRightWidth: 1,
    borderRightColor: '#222',
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
    color: '#8A2BE2'
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
  navItemActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRightWidth: 3,
    borderRightColor: '#8A2BE2'
  },
  navText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600'
  },
  navTextActive: {
    color: '#fff'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden'
  }
});
