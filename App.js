import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// A wrapper component to access the theme hook inside NavigationContainer
const Main = () => {
  const { isDarkTheme, colors } = useAppTheme();
  const navigationTheme = {
    ...(isDarkTheme ? NavDarkTheme : DefaultTheme),
    colors: {
      ...(isDarkTheme ? NavDarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F7FB' }}>
        <ActivityIndicator size="large" color="#0E004E" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Main />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
