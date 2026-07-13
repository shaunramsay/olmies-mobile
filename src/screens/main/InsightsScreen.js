import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { Badge, Button, IconChip } from '../../components/ui';
import { fonts, radii, shadow, spacing } from '../../utils/theme';

export default function InsightsScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();

  const returnToSurveys = () => {
    const routeNames = navigation.getState?.().routeNames || [];
    if (routeNames.includes('Surveys')) {
      navigation.navigate('Surveys');
      return;
    }

    navigation.navigate('Main', { screen: 'Surveys' });
  };

  const header = (
    <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
      <TouchableOpacity style={styles.backButton} onPress={returnToSurveys}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Survey Insights</Text>
      <View style={styles.topRightActions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
          <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={17} color={colors.textSecondary} />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
            <IconChip name="lock-closed" tone="navy" size={72} iconSize={30} />
            <Text style={{ fontSize: 21, fontFamily: fonts.extraBold, color: colors.text, marginTop: 20, marginBottom: 10 }}>Insights Locked</Text>
            <Text style={{ fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: 26, lineHeight: 21, maxWidth: 340 }}>
                Sign in with your University credentials to unlock your academic performance insights and sentiment data.
            </Text>
            <Button label="Sign In" icon="log-in-outline" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Campus Pulse Overview */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Campus Pulse</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>General satisfaction based on latest campus surveys.</Text>

          <View style={styles.metricRow}>
            <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.secondary }]}>4.2<Text style={[styles.metricLabelInline, { color: colors.textSecondary }]}> / 5.0</Text></Text>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Overall Satisfaction</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.secondary }]}>85%</Text>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Student Engagement</Text>
            </View>
          </View>
        </View>

        {/* Module Ratings */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your Module Ratings</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Aggregated sentiment from modules you are participating in.</Text>

          <View style={styles.moduleMetric}>
            <View style={styles.moduleHeaderRow}>
              <Text style={[styles.moduleCode, { color: colors.text }]}>INT4020</Text>
              <Badge label="Positive (4.5)" tone="success" />
            </View>
            <Text style={[styles.moduleSnippet, { color: colors.textSecondary }]}>"Students appreciate the practical lab sessions..."</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.moduleMetric}>
            <View style={styles.moduleHeaderRow}>
              <Text style={[styles.moduleCode, { color: colors.text }]}>CMP3011</Text>
              <Badge label="Neutral (3.8)" tone="warning" />
            </View>
            <Text style={[styles.moduleSnippet, { color: colors.textSecondary }]}>"Pacing could be improved during the mid-term topics..."</Text>
          </View>
        </View>

        {/* Action Call */}
        <View style={[styles.actionCard, { backgroundColor: colors.accentTint, borderColor: colors.accent }]}>
          <IconChip name="chatbubbles-outline" tone="accent" size={44} iconSize={20} />
          <Text style={[styles.actionTitle, { color: colors.text, marginTop: 12 }]}>Your voice matters</Text>
          <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
            The insights here are generated from reviews submitted by students like you. Continue to provide honest feedback to improve the campus experience!
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    marginLeft: 2,
    flex: 1,
    letterSpacing: -0.3,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  metricLabelInline: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  metricTitle: {
    fontSize: 11.5,
    textAlign: 'center',
    fontFamily: fonts.bold,
  },
  moduleMetric: {
    marginVertical: 4,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleCode: {
    fontSize: 14.5,
    fontFamily: fonts.extraBold,
  },
  moduleSnippet: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  actionCard: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    marginBottom: 8,
  },
  actionDesc: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  }
});
