import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, IconChip } from '../../components/ui';
import { brand, fonts, radii, spacing } from '../../utils/theme';

const UTECH_CREST = require('../../../assets/utech-crest.png');

const FEATURES = [
  { icon: 'clipboard-outline', tone: 'accent', title: 'Module evaluations', desc: 'Have your say each semester' },
  { icon: 'map-outline', tone: 'navy', desc: 'Find any building or service', title: 'Campus map' },
  { icon: 'chatbubbles-outline', tone: 'success', desc: 'Instant answers, day or night', title: 'Ask UTech AI' },
];

export default function LandingScreen({ navigation }) {
  const { colors, toggleTheme, isDarkTheme } = useAppTheme();
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 720;

  useEffect(() => {
    if (token) {
      navigation.replace('Main');
    }
  }, [token, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroRing} />
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Ionicons name={isDarkTheme ? 'sunny-outline' : 'moon-outline'} size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.crestBadge}>
            <Image source={UTECH_CREST} style={styles.crest} resizeMode="contain" />
          </View>
          <Text style={styles.eyebrow}>University of Technology, Jamaica</Text>
          <Text style={styles.title}>Campus Companion</Text>
          <Text style={styles.subtitle}>
            Surveys, campus alerts, maps and the UTech AI help desk — everything for life on campus, in one place.
          </Text>

          <View style={[styles.actions, isWide && styles.actionsRow]}>
            <Button
              label="Enter Campus Companion"
              variant="accent"
              icon="arrow-forward"
              onPress={() => navigation.replace('Main')}
              style={styles.enterButton}
            />
            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Log in here</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.features, isWide && styles.featuresRow]}>
          {FEATURES.map(f => (
            <Card key={f.title} style={[styles.featureCard, isWide && styles.featureCardWide]}>
              <View style={styles.featureRow}>
                <IconChip name={f.icon} tone={f.tone} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Need help? Contact the IT Service Desk.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: brand.navy,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroRing: {
    position: 'absolute',
    left: -70,
    bottom: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 30,
    borderColor: 'rgba(255,210,1,0.10)',
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestBadge: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    backgroundColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  crest: { width: '100%', height: '100%' },
  eyebrow: {
    color: brand.gold,
    fontFamily: fonts.bold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: brand.onNavySecondary,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: 10,
  },
  actions: {
    marginTop: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  actionsRow: {
    maxWidth: 460,
  },
  enterButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
  },
  loginLink: { marginTop: 16, padding: 8 },
  loginLinkText: { color: '#FFFFFF', fontFamily: fonts.semiBold, fontSize: 14 },
  features: {
    paddingHorizontal: 20,
    marginTop: -28,
    gap: spacing.md,
  },
  featuresRow: {
    flexDirection: 'row',
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  featureCard: {},
  featureCardWide: { flex: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureTitle: { fontFamily: fonts.bold, fontSize: 14 },
  featureDesc: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  footerText: {
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 12.5,
  },
});
