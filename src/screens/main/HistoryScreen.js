import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Button, EmptyState, IconChip } from '../../components/ui';
import { fonts, radii, shadow, spacing } from '../../utils/theme';

export default function HistoryScreen({ navigation }) {
  const { fetchWithAuth } = useAuth();
  const { colors, isDarkTheme } = useAppTheme();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const returnToSurveys = () => {
    const routeNames = navigation.getState?.().routeNames || [];
    if (routeNames.includes('Surveys')) {
      navigation.navigate('Surveys');
      return;
    }

    navigation.navigate('Main', { screen: 'Surveys' });
  };

  const loadPastSurveys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/v1/mobile/past-surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
      } else {
        setError('Failed to load past surveys.');
      }
    } catch (err) {
      console.error('Error fetching past surveys:', err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPastSurveys();
  }, [fetchWithAuth]);

  const renderSurveyItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}
      onPress={() => navigation.navigate('SurveyResults', { windowId: item.windowId, surveyName: item.name })}
    >
      <View style={styles.cardHeader}>
        <IconChip name="pie-chart" tone="navy" />
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.semester} {item.year}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={returnToSurveys}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community Results</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Analytics from past Open Campus Surveys.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <EmptyState
            icon="alert-circle-outline"
            title="Couldn't load results"
            message={error}
            action={<Button label="Retry" variant="ghost" size="sm" onPress={loadPastSurveys} style={{ marginTop: spacing.md }} />}
          />
        </View>
      ) : surveys.length === 0 ? (
        <View style={styles.centerContent}>
          <EmptyState icon="document-text-outline" title="Nothing here yet" message="No past surveys available yet." />
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={(item) => item.windowId.toString()}
          renderItem={renderSurveyItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 14, padding: 4 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 21, fontFamily: fonts.extraBold, marginBottom: 3, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12.5, fontFamily: fonts.regular },
  listContent: { padding: spacing.lg, maxWidth: 760, width: '100%', alignSelf: 'center' },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitle: { fontSize: 14.5, fontFamily: fonts.bold },
  cardSubtitle: { fontSize: 12, fontFamily: fonts.regular, marginTop: 3 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
