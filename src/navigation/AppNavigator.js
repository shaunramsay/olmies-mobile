import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import DataProtectionScreen from '../screens/auth/DataProtectionScreen';
import MainTabNavigator from './MainTabNavigator';
import WebNavigationShell from './WebNavigationShell';
import SurveyScreen from '../screens/survey/SurveyScreen';
import SurveyResultsScreen from '../screens/survey/SurveyResultsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading, hasAcceptedDPA } = useAuth();
  const { colors } = useAppTheme();

  if (isLoading || hasAcceptedDPA === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Block the entire app context until DPA is accepted
  if (hasAcceptedDPA === false) {
    return <DataProtectionScreen route={{ params: { isReviewMode: false } }} />
  }

  const MainComponent = Platform.OS === 'web' ? WebNavigationShell : MainTabNavigator;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={token ? "Main" : "Landing"}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Main" component={MainComponent} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Survey" component={SurveyScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="SurveyResults" component={SurveyResultsScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="DataProtection" component={DataProtectionScreen} options={{ presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
