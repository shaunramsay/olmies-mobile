import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, right: 30, zIndex: 10 }} 
        onPress={toggleTheme}
      >
        <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={28} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        
        {/* Mock Logo / Branding */}
        <View style={styles.logoContainer}>
            <Ionicons name="cube" size={80} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>OLMIES</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Student & Lecturer Portal</Text>
        </View>

        <View style={styles.bottomSection}>
            <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={() => navigation.replace('Main')}
            >
                <Text style={styles.primaryButtonText}>Experience UTech!</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 24, padding: 10, alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                    Already a student? <Text style={{ color: colors.primary }}>Log in here</Text>
                </Text>
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: colors.textSecondary, marginTop: 12 }]}>
                Need help? Contact the IT Service Desk.
            </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 40,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  }
});
