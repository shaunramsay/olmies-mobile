import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii, shadow, spacing } from '../../utils/theme';

export default function SurveyResultsScreen({ route, navigation }) {
  const { windowId, surveyName } = route.params;
  const { fetchWithAuth } = useAuth();
  const { colors, isDarkTheme } = useAppTheme();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const returnToPrevious = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Main', { screen: 'Surveys' });
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetchWithAuth(`/api/v1/mobile/surveys/windows/${windowId}/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          const errData = await response.json();
          setError(errData.error || 'Results are currently protected or unavailable.');
        }
      } catch (err) {
        console.error('Error fetching survey results:', err);
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [windowId, fetchWithAuth]);

  const renderDistributionBar = (dist, maxCount) => {
    // Fill percentage relative to the max count to scale the bars nicely
    const fillPercent = maxCount > 0 ? (dist.count / maxCount) * 100 : 0;

    // Choose color (Likert: 1-5, MultipleChoice: neutral)
    let barColor = colors.info; // neutral default
    if (dist.label === '5' || dist.label === '4' || dist.label.toLowerCase() === 'yes') barColor = colors.success;
    if (dist.label === '3' || dist.label.toLowerCase() === 'maybe') barColor = colors.warning;
    if (dist.label === '2' || dist.label === '1' || dist.label.toLowerCase() === 'no') barColor = colors.danger;

    return (
      <View key={dist.label} style={styles.barRow}>
        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{dist.label}</Text>
        <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={[styles.barPercent, { color: colors.textSecondary }]}>{dist.percentage}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15, fontFamily: fonts.regular }}>Aggregating community responses...</Text>
      </View>
    );
  }

  if (error || !results) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={44} color={colors.danger} style={{ marginBottom: 10 }} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'This survey has not met the threshold to publish results.'}</Text>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={returnToPrevious}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter quantitative questions only
  const quantitativeQs = (results.questions || []).filter(q => q.type === 'Likert' || q.type === 'MultipleChoice');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={returnToPrevious}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{surveyName || 'Survey Results'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>Community Insights</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Executive Summary */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
            <Ionicons name="people" size={24} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{results.totalResponses}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Responses</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
             <Ionicons name="star" size={24} color={colors.accentInk} />
             <Text style={[styles.statValue, { color: colors.text }]}>
                {results.overallSatisfactionScore > 0 ? results.overallSatisfactionScore.toFixed(1) : 'N/A'}
             </Text>
             <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Satisfaction</Text>
          </View>
        </View>

        {quantitativeQs.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={{ color: colors.textSecondary, marginTop: 40, fontFamily: fonts.regular }}>No quantitative data available to display.</Text>
          </View>
        ) : (
          quantitativeQs.map((q, qIdx) => {
            const maxCount = Math.max(...(q.distribution || []).map(d => d.count), 0);
            return (
              <View key={q.questionId || qIdx} style={[styles.questionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
                <View style={styles.qHeader}>
                  <Text style={[styles.qTitle, { color: colors.text }]}>{q.orderIndex}. {q.text}</Text>
                  {q.type === 'Likert' && q.meanScore && (
                    <View style={[styles.meanBadge, { backgroundColor: colors.primaryTint, borderColor: colors.secondary }]}>
                      <Text style={[styles.meanBadgeText, { color: colors.secondary }]}>Avg: {q.meanScore}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.chartContainer}>
                  {(q.distribution || []).map(dist => renderDistributionBar(dist, maxCount))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 14 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold },
  headerSubtitle: { fontSize: 12, fontFamily: fonts.bold, marginTop: 2 },
  scrollContent: { padding: spacing.lg, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statBox: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: fonts.extraBold, marginTop: 8, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11.5, fontFamily: fonts.semiBold, marginTop: 4 },

  questionCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  qTitle: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: fonts.bold,
    lineHeight: 21,
    marginRight: spacing.md,
  },
  meanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  meanBadgeText: { fontSize: 11.5, fontFamily: fonts.bold },

  chartContainer: {
    marginTop: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  barLabel: {
    width: 58,
    fontSize: 12.5,
    fontFamily: fonts.medium,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercent: {
    width: 42,
    textAlign: 'right',
    fontSize: 11.5,
    fontFamily: fonts.semiBold,
    fontVariant: ['tabular-nums'],
  },

  errorText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20, fontFamily: fonts.regular },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.sm,
  },
  secondaryButtonText: { fontSize: 13.5, fontFamily: fonts.bold }
});
