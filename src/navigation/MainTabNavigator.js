import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Using inline placeholders for screens before we build the actual ones
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

const PlaceholderScreen = ({ name }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{name}</Text>
    <Text style={{ color: '#aaa' }}>Screen coming soon!</Text>
  </View>
);
import StudentHubScreen from '../screens/main/StudentHubScreen';

import AlertsScreen from '../screens/main/AlertsScreen';
import MapScreen from '../screens/main/CampusMapScreen';
import InsightsScreen from '../screens/main/InsightsScreen';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let iconName = '';
        if (route.name === 'Hub') iconName = isFocused ? 'home' : 'home-outline';
        if (route.name === 'Alerts') iconName = isFocused ? 'notifications' : 'notifications-outline';
        if (route.name === 'Map') iconName = isFocused ? 'map' : 'map-outline';
        if (route.name === 'Insights') iconName = isFocused ? 'pie-chart' : 'pie-chart-outline';

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? '#8A2BE2' : 'gray'} 
            />
            <Text style={{ color: isFocused ? '#8A2BE2' : 'gray', fontSize: 12, marginTop: 4 }}>
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Hub" component={StudentHubScreen} options={{ title: 'Hub' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
    </Tab.Navigator>
  );
}
