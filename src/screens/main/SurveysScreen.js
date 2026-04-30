import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getUTechSemester } from '../../utils/dateUtils';
import { useAppTheme } from '../../context/ThemeContext';

export default function SurveysScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, fetchWithAuth } = useAuth();
  const { colors } = useAppTheme();

  const [modules, setModules] = useState([]);
  const [openSurveys, setOpenSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLecturer = Array.isArray(user?.role)
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const requests = [
          fetchWithAuth('/api/v1/mobile/open-surveys')
        ];

        if (user) {
          requests.unshift(fetchWithAuth('/api/v1/mobile/modules'));
        }

        const responses = await Promise.all(requests);

        if (user) {
          const [modulesRes, surveysRes] = responses;
          if (modulesRes.ok) setModules(await modulesRes.json());
          if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
        } else {
          const [surveysRes] = responses;
          if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
          setModules([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchWithAuth, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0) }]}>

      {/* Sticky Header Section */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Ionicons name="clipboard-outline" size={28} color={colors.secondary} />
          <Text style={[styles.titleText, { color: colors.secondary }]}>Surveys</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage module evaluations and campus surveys.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Quick Actions (History & Insights) */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}26` }]}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Insights')}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${colors.info}26` }]}>
              <Ionicons name="pie-chart-outline" size={24} color={colors.info} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Early Grade Access Card (Students Only) */}
        {!isLecturer && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="stats-chart-outline" size={20} color={colors.text} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>My Evaluation Progress</Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {!user
                ? "Sign in to view your module evaluation progress!"
                : "Complete your module evaluations to help improve the university. Every voice matters!"}
            </Text>

            {/* Progress Bar */}
            {user && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${modules.length > 0 ? (Math.round((modules.filter(m => m.hasCompleted).length / modules.length) * 100)) : 0}%` }]} />
                </View>
                <View style={styles.progressTextRow}>
                  <Text style={[styles.progressTextLeft, { color: colors.textSecondary }]}>{modules.filter(m => m.hasCompleted).length} Evaluated</Text>
                  <Text style={[styles.progressTextRight, { color: colors.textSecondary }]}>{modules.length} Total</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* My Modules Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isLecturer ? "My Teaching Modules" : "My Modules"} - {getUTechSemester().fullDisplay}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {!user ? (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginVertical: 10 }}>
              <Ionicons name="lock-closed-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={[styles.cardDescription, { textAlign: 'center', color: colors.textSecondary }]}>Sign in to view your modules and pending evaluations.</Text>
              <View style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 10 }]}>
                <Ionicons name="log-in-outline" size={18} color="#fff" style={{marginRight: 6}} />
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </View>
            </TouchableOpacity>
          ) : loading ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : modules.length === 0 ? (
             <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>You are not currently {isLecturer ? 'assigned to' : 'enrolled in'} any active modules.</Text>
          ) : (
            modules.map((mod, index) => (
              <View key={mod.moduleOfferingId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, { color: colors.primary }]}>{mod.moduleCode}</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>

                  {isLecturer ? (
                    mod.activeSurveyId ? (
                      <View style={[styles.lockedButton, {backgroundColor: `${colors.primary}26`, borderColor: colors.primary}]}>
                        <Ionicons name="pulse-outline" size={16} color={colors.primary} style={{marginRight: 4}} />
                        <Text style={[styles.lockedButtonText, {color: colors.primary}]}>Survey Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.lockedButton, {backgroundColor: colors.border}]}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{marginRight: 4}} />
                        <Text style={[styles.lockedButtonText, {color: colors.textSecondary}]}>No Survey</Text>
                      </View>
                    )
                  ) : (
                    mod.hasCompleted ? (
                      <View style={[styles.lockedButton, {backgroundColor: `${colors.success}26`, borderColor: colors.success}]}>
                        <Ionicons name="checkmark-done" size={16} color={colors.success} style={{marginRight: 4}} />
                        <Text style={[styles.lockedButtonText, {color: colors.success}]}>Completed</Text>
                      </View>
                    ) : mod.activeSurveyId ? (
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Survey', { surveyId: mod.activeSurveyId, moduleCode: mod.moduleCode })}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{marginRight: 6}} />
                        <Text style={styles.primaryButtonText}>Take Survey</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.lockedButton, {backgroundColor: colors.border}]}>
                        <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} style={{marginRight: 4}} />
                        <Text style={[styles.lockedButtonText, {color: colors.textSecondary}]}>No Survey</Text>
                      </View>
                    )
                  )}

                </View>
                {index < modules.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))
          )}
        </View>

        {/* Open Campus Surveys Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="sparkles-outline" size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Open Campus Surveys</Text>
          </View>

          <View style={{marginTop: 15}}>
          {loading ? (
             <ActivityIndicator size="small" color={colors.secondary} />
          ) : openSurveys.length === 0 ? (
             <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>There are currently no open campus-wide surveys.</Text>
          ) : (
            openSurveys.map((survey, index) => (
              <View key={survey.surveyId}>
                <View style={styles.moduleRow}>
                  <View style={{flex: 1, paddingRight: 10}}>
                    <Text style={[styles.moduleLabel, {color: colors.secondary}]}>{survey.audience} Survey</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{survey.name}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, {backgroundColor: colors.secondary}]}
                    onPress={() => navigation.navigate('Survey', { surveyId: survey.surveyId, moduleCode: survey.name })}
                  >
                    <Ionicons name="sparkles" size={16} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.primaryButtonText}>Participate</Text>
                  </TouchableOpacity>

                </View>
                {index < openSurveys.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))
          )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  titleText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  subtitle: { fontSize: 13, paddingHorizontal: 0 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  cardDescription: { fontSize: 14, color: '#aaa', lineHeight: 22, marginBottom: 20 },
  lockedButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  lockedButtonText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  progressBarContainer: { marginTop: 10 },
  progressBarBackground: { height: 6, backgroundColor: '#333', borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4A90E2' },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressTextLeft: { color: '#888', fontSize: 12 },
  progressTextRight: { color: '#888', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: 15 },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleLabel: { color: '#4A90E2', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  moduleCode: { color: '#fff', fontSize: 16, fontWeight: '600' },
  primaryButton: { flexDirection: 'row', backgroundColor: '#5C6BC0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
