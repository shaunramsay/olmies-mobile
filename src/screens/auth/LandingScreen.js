import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Mock Logo / Branding */}
        <View style={styles.logoContainer}>
            <Ionicons name="cube" size={80} color="#8A2BE2" />
            <Text style={styles.title}>OLMIES</Text>
            <Text style={styles.subtitle}>Student & Lecturer Portal</Text>
        </View>

        <View style={styles.bottomSection}>
            <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.replace('Main')}
            >
                <Text style={styles.primaryButtonText}>Experience UTech!</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 24, padding: 10, alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: '#aaa', fontSize: 16, fontWeight: '600' }}>
                    Already a student? <Text style={{ color: '#8A2BE2' }}>Log in here</Text>
                </Text>
            </TouchableOpacity>

            <Text style={[styles.footerText, { marginTop: 12 }]}>
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
    backgroundColor: '#121212', // Dark theme matching the web portal
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
    color: '#fff',
    marginTop: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 10,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A2BE2',
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
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  }
});
