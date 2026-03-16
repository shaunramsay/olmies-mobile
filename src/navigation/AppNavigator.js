import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';

import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import WebNavigationShell from './WebNavigationShell';
import SurveyScreen from '../screens/survey/SurveyScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  const MainComponent = Platform.OS === 'web' ? WebNavigationShell : MainTabNavigator;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        // User is logged in -> Show the main Dashboard / Tabs
        <Stack.Group>
          <Stack.Screen name="Main" component={MainComponent} />
          <Stack.Screen name="Survey" component={SurveyScreen} options={{ presentation: 'fullScreenModal' }} />
        </Stack.Group>
      ) : (
        // User is NOT logged in -> Show the Welcome / Login flow
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212'
  }
});
