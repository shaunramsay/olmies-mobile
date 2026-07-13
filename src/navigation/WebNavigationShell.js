import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../context/ThemeContext';
import { brand, fonts, radii, spacing } from '../utils/theme';

const Tab = createBottomTabNavigator();
const UTECH_CREST = require('../../assets/utech-crest.png');
const SIDEBAR_WIDE = 212;
const SIDEBAR_RAIL = 68;

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
  const { toggleTheme, isDarkTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isRail = width < 720;

  // History and Insights are reached from inside Surveys (quick-action cards), not
  // as their own sidebar entries - keeping them as top-level tabs here was a stale
  // leftover from an earlier redesign pass. Their Tab.Screen registrations stay below
  // so navigation.navigate('History'/'Insights') from SurveysScreen still works.
  const navItems = [
    { id: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'Surveys', icon: 'clipboard-outline', activeIcon: 'clipboard' },
    { id: 'Help Desk', label: 'AI Help Desk', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
    { id: 'Map', icon: 'map-outline', activeIcon: 'map' },
    { id: 'Alerts', label: 'Notifications', icon: 'notifications-outline', activeIcon: 'notifications' },
  ];

  return (
    <View style={[styles.sidebar, { width: isRail ? SIDEBAR_RAIL : SIDEBAR_WIDE }]}>
      <View style={[styles.branding, isRail && styles.brandingRail]}>
        <View style={styles.brandBadge}>
          <Image source={UTECH_CREST} style={styles.brandLogo} resizeMode="contain" />
        </View>
        {!isRail && (
          <>
            <Text style={styles.brandName}>UTech · Olmies</Text>
            <Text style={styles.brandSub}>Campus Companion</Text>
          </>
        )}
      </View>

      <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
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
              style={[styles.navItem, isRail && styles.navItemRail, isFocused && styles.navItemActive]}
              onPress={onPress}
              accessibilityLabel={itemConfig.label || route.name}
            >
              <Ionicons
                name={isFocused ? itemConfig.activeIcon : itemConfig.icon}
                size={19}
                color={isFocused ? brand.gold : brand.onNavySecondary}
                style={!isRail && { marginRight: 12 }}
              />
              {!isRail && (
                <Text style={[styles.navText, isFocused && styles.navTextActive]}>
                  {itemConfig.label || route.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sfoot}>
        <TouchableOpacity style={[styles.footItem, isRail && styles.navItemRail]} onPress={toggleTheme} accessibilityLabel="Toggle theme">
          <Ionicons name={isDarkTheme ? 'sunny-outline' : 'moon-outline'} size={18} color={brand.onNavySecondary} style={!isRail && { marginRight: 12 }} />
          {!isRail && <Text style={styles.footText}>{isDarkTheme ? 'Light theme' : 'Dark theme'}</Text>}
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity style={[styles.footItem, isRail && styles.navItemRail]} onPress={logout} accessibilityLabel="Logout">
            <Ionicons name="log-out-outline" size={18} color={brand.onNavySecondary} style={!isRail && { marginRight: 12 }} />
            {!isRail && <Text style={styles.footText}>Logout</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.footItem, isRail && styles.navItemRail]} onPress={() => navigation.navigate('Login')} accessibilityLabel="Login">
            <Ionicons name="log-in-outline" size={18} color={brand.onNavySecondary} style={!isRail && { marginRight: 12 }} />
            {!isRail && <Text style={styles.footText}>Login</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function WebNavigationShell() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const sidebarWidth = width < 720 ? SIDEBAR_RAIL : SIDEBAR_WIDE;
  const isLecturer = Array.isArray(user?.role)
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Tab.Navigator
        tabBar={props => <CustomSidebar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background, marginLeft: sidebarWidth }
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
    width: 212,
    backgroundColor: brand.navy,
    paddingVertical: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  branding: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  brandingRail: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  brandSub: {
    color: brand.onNavySecondary,
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    marginBottom: 2,
    borderRadius: radii.md,
  },
  navItemRail: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: brand.goldTint,
  },
  navText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: brand.onNavySecondary,
  },
  navTextActive: {
    color: brand.gold,
  },
  sfoot: {
    borderTopWidth: 1,
    borderTopColor: brand.onNavyBorder,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  footItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  footText: {
    fontSize: 12.5,
    fontFamily: fonts.semiBold,
    color: brand.onNavySecondary,
  },
});
