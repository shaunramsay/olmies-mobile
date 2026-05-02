import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const UTECH_CREST = require('../../../assets/utech-crest.png');

export default function LandingScreen({ navigation }) {
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      navigation.replace('Main');
    }
  }, [token, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, right: 30, zIndex: 10 }} 
        onPress={toggleTheme}
      >
        <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={28} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>

        <View style={styles.brandContainer}>
            <Image source={UTECH_CREST} style={styles.crest} resizeMode="contain" />
            <Text style={[styles.institutionName, { color: colors.text }]}>University of Technology, Jamaica</Text>
            <Text style={[styles.productName, { color: colors.text }]}>Campus Companion</Text>
        </View>

        <View style={styles.bottomSection}>
            <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={() => navigation.replace('Main')}
            >
                <Text style={styles.primaryButtonText}>Enter Campus Companion</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 24, padding: 10, alignItems: 'center' }} onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                    Have a UTech account? <Text style={{ color: colors.primary }}>Log in here</Text>
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
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  crest: {
    width: 176,
    height: 220,
    marginBottom: 24,
  },
  institutionName: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
    maxWidth: 320,
  },
  productName: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 8,
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
