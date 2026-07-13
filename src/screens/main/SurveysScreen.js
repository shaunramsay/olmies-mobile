import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { fetchUTechSemester, getUTechSemester } from '../../utils/dateUtils';
import { useAppTheme } from '../../context/ThemeContext';
import { Badge, ProgressBar } from '../../components/ui';
import { fonts, radii, shadow, spacing } from '../../utils/theme';

export default function SurveysScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, fetchWithAuth, logout } = useAuth();
  const { colors, isDarkTheme, toggleTheme } = useAppTheme();
  const onPrimaryText = isDarkTheme ? '#1A1400' : '#FFFFFF';

  const [modules, setModules] = useState([]);
  const [openSurveys, setOpenSurveys] = useState([]);
  const [engagementItems, setEngagementItems] = useState([]);
  const [engagementGroups, setEngagementGroups] = useState([]);
  const [currentPeriodDisplay, setCurrentPeriodDisplay] = useState(() => getUTechSemester().fullDisplay);
  const [loading, setLoading] = useState(true);

  const isLecturer = Array.isArray(user?.role)
    ? user.role.some(r => r.toLowerCase() === 'lecturer')
    : user?.role?.toLowerCase() === 'lecturer';

  // Refetch on focus (not just mount) so returning from a submitted survey shows the
  // updated Pending -> Submitted status and counts instead of the stale pre-submission state.
  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        setLoading(true);
        try {
          const period = await fetchUTechSemester(fetchWithAuth);
          setCurrentPeriodDisplay(period.fullDisplay);

          if (user) {
            const [modulesRes, engagementsRes, surveysRes] = await Promise.all([
              fetchWithAuth('/api/v1/mobile/modules'),
              fetchWithAuth('/api/v1/student/engagements'),
              fetchWithAuth('/api/v1/mobile/open-surveys')
            ]);

            if (modulesRes.ok) setModules(await modulesRes.json());
            if (engagementsRes.ok) {
              const engagementFeed = await engagementsRes.json();
              setEngagementItems(Array.isArray(engagementFeed?.items) ? engagementFeed.items : []);
              setEngagementGroups(Array.isArray(engagementFeed?.campaignGroups) ? engagementFeed.campaignGroups : []);
            } else {
              setEngagementItems([]);
              setEngagementGroups([]);
            }
            if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
          } else {
            const surveysRes = await fetchWithAuth('/api/v1/mobile/open-surveys');
            if (surveysRes.ok) setOpenSurveys(await surveysRes.json());
            setModules([]);
            setEngagementItems([]);
            setEngagementGroups([]);
          }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, [fetchWithAuth, user])
  );

  const pendingEngagementItems = engagementItems.filter(item => item.status === 'Pending');
  const getEngagementTitle = (source) => {
    if (source?.surveyTitle) return source.surveyTitle;
    if (source?.title && !source?.moduleCode) return source.title;
    if (source?.engagementType === 'ModuleEvaluation') return 'Student Module/Instructor Evaluation';
    return source?.engagementType || 'Pending Engagement';
  };
  const getCampaignTitle = (source) => source?.campaignTitle || source?.campaignName || source?.title || 'Unassigned Campaign';
  const normalizedEngagementGroups = engagementGroups.length > 0
    ? engagementGroups.map(group => {
        const items = Array.isArray(group.items) ? group.items : [];
        return {
          ...group,
          items,
          pendingItems: items.filter(item => item.status === 'Pending'),
          submittedItems: items.filter(item => item.status === 'Submitted'),
          closedItems: items.filter(item => ['Closed', 'Expired', 'Withdrawn'].includes(item.status))
        };
      }).filter(group => group.items.length > 0)
    : [{
        campaignId: 'standalone',
        title: 'Pending Engagements',
        engagementType: 'Assignment',
        items: engagementItems,
        pendingItems: pendingEngagementItems,
        submittedItems: engagementItems.filter(item => item.status === 'Submitted'),
        closedItems: engagementItems.filter(item => ['Closed', 'Expired', 'Withdrawn'].includes(item.status))
      }].filter(group => group.items.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0) }]}>

      {/* Sticky Header Section */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>Surveys</Text>
          </View>
          <View style={styles.topRightActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={toggleTheme}>
              <Ionicons name={isDarkTheme ? "sunny-outline" : "moon-outline"} size={17} color={colors.textSecondary} />
            </TouchableOpacity>
            {user ? (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={logout}>
                <Ionicons name="log-out-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginLeft: 8 }]} onPress={() => navigation.navigate('Login')}>
                <Ionicons name="log-in-outline" size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Module evaluations and campus-wide surveys.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Quick Actions (History & Insights) */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
              <Ionicons name="time-outline" size={22} color={colors.secondary} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}
            onPress={() => navigation.navigate('Insights')}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.infoTint }]}>
              <Ionicons name="pie-chart-outline" size={22} color={colors.info} />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Early Grade Access Card (Students Only) */}
        {!isLecturer && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>My Evaluation Progress</Text>
              </View>
              {user && modules.length > 0 && (
                <Text style={[styles.progressCount, { color: colors.text }]}>
                  {modules.filter(m => m.hasCompleted).length} of {modules.length}
                </Text>
              )}
            </View>

            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {!user
                ? "Sign in to view your module evaluation progress!"
                : "Complete your module evaluations to help improve the university. Every voice matters!"}
            </Text>

            {/* Progress Bar */}
            {user && (
              <View style={styles.progressBarContainer}>
                <ProgressBar progress={modules.length > 0 ? modules.filter(m => m.hasCompleted).length / modules.length : 0} />
                <View style={styles.progressTextRow}>
                  <Text style={[styles.progressTextLeft, { color: colors.textSecondary }]}>{modules.filter(m => m.hasCompleted).length} Evaluated</Text>
                  <Text style={[styles.progressTextRight, { color: colors.textSecondary }]}>{modules.length} Total</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {user && !isLecturer && normalizedEngagementGroups.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Pending Engagements</Text>
            </View>
            <Text style={[styles.cardDescription, { color: colors.textSecondary, marginTop: 6 }]}>
              Please complete the evaluations for your registered modules below.
            </Text>

            <View style={{ marginTop: 15 }}>
              {normalizedEngagementGroups.map((group, groupIndex) => {
                const nextPending = group.pendingItems[0];
                const isHighlighted = !!nextPending;
                return (
                  <View
                    key={group.campaignId || group.title || groupIndex}
                    style={[
                      styles.assignmentGroup,
                      isHighlighted
                        ? { borderColor: colors.accent, backgroundColor: colors.accentTint }
                        : { borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                  >
                    <View style={styles.assignmentHeaderRow}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.moduleLabel, { color: colors.secondary }]}>
                          {group.engagementType === 'ModuleEvaluation' ? 'Module Evaluation' : group.engagementType}
                        </Text>
                        <Text style={[styles.assignmentTitle, { color: colors.text }]}>{getEngagementTitle(group)}</Text>
                        <Text style={[styles.cardDescription, { color: colors.textSecondary, marginBottom: 0 }]}>
                          {getCampaignTitle(group)}
                        </Text>
                      </View>
                      {nextPending && (
                        <TouchableOpacity
                          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                          onPress={() => navigation.navigate('Survey', {
                            surveyId: nextPending.surveyId,
                            moduleCode: nextPending.moduleCode || nextPending.title,
                            moduleOfferingId: nextPending.moduleOfferingId,
                            campaignId: nextPending.campaignId,
                            surveyWindowId: nextPending.surveyWindowId,
                            assignmentId: nextPending.assignmentId
                          })}
                        >
                          <Ionicons name="open-outline" size={15} color="#1A1400" style={{ marginRight: 6 }} />
                          <Text style={[styles.primaryButtonText, { color: '#1A1400' }]}>Continue</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.assignmentStatusRow}>
                      <Badge label={`${group.pendingItems.length} pending`} tone="warning" style={{ marginRight: 8, marginBottom: 8 }} />
                      <Badge label={`${group.submittedItems.length} submitted`} tone="success" style={{ marginRight: 8, marginBottom: 8 }} />
                      {group.closedItems.length > 0 && (
                        <Badge label={`${group.closedItems.length} closed`} tone="neutral" style={{ marginBottom: 8 }} />
                      )}
                    </View>

                    {group.pendingItems.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={[styles.assignmentSectionTitle, { color: colors.text }]}>Pending Modules</Text>
                        {group.pendingItems.map((item, index) => (
                          <View key={item.assignmentId || `${item.surveyId}-${index}`} style={styles.assignmentModuleRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={[styles.moduleCode, { color: colors.text }]}>
                                {item.moduleCode ? `${item.moduleCode} - ${item.moduleName || item.title}` : item.title}
                              </Text>
                              {!!(item.instructorName || item.lecturerId) && (
                                <Text style={[styles.cardDescription, { color: colors.textSecondary, marginBottom: 0 }]}>
                                  Instructor: {item.instructorName || item.lecturerId}
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                              onPress={() => navigation.navigate('Survey', {
                                surveyId: item.surveyId,
                                moduleCode: item.moduleCode || item.title,
                                moduleOfferingId: item.moduleOfferingId,
                                campaignId: item.campaignId,
                                surveyWindowId: item.surveyWindowId,
                                assignmentId: item.assignmentId
                              })}
                            >
                              <Text style={[styles.primaryButtonText, { color: onPrimaryText }]}>Open</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {group.submittedItems.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={[styles.assignmentSectionTitle, { color: colors.text }]}>Submitted</Text>
                        {group.submittedItems.map((item, index) => (
                          <View key={item.assignmentId || `${item.surveyId}-submitted-${index}`} style={styles.assignmentModuleRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.moduleCode, { color: colors.text }]}>
                                {item.moduleCode ? `${item.moduleCode} - ${item.moduleName || item.title}` : item.title}
                              </Text>
                            </View>
                            <Badge label="Submitted" tone="success" />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* My Modules Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isLecturer ? "My Teaching Modules" : "Module Enrollment Reference"} - {currentPeriodDisplay}
          </Text>
          {!isLecturer && (
            <Text style={[styles.cardDescription, { color: colors.textSecondary, marginTop: 4 }]}>
              This section displays your module enrollments for reference only. Active evaluation campaigns are processed under Pending Engagements.
            </Text>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {!user ? (
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginVertical: 10 }}>
              <Ionicons name="lock-closed-outline" size={38} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={[styles.cardDescription, { textAlign: 'center', color: colors.textSecondary }]}>Sign in to view your modules and pending evaluations.</Text>
              <View style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 10 }]}>
                <Ionicons name="log-in-outline" size={17} color={onPrimaryText} style={{marginRight: 6}} />
                <Text style={[styles.primaryButtonText, { color: onPrimaryText }]}>Sign In</Text>
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
                    <Text style={[styles.moduleLabel, { color: colors.secondary }]}>{mod.moduleCode}</Text>
                    <Text style={[styles.moduleCode, { color: colors.text }]}>{mod.moduleName || mod.moduleCode}</Text>
                  </View>

                  {isLecturer ? (
                    mod.activeSurveyId ? (
                      <Badge label="Survey Active" tone="warning" />
                    ) : (
                      <Badge label="No Survey" tone="neutral" />
                    )
                  ) : (
                    <Badge label="Enrolled" tone="info" />
                  )}

                </View>
                {index < modules.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))
          )}
        </View>

        {/* Open Campus Surveys Card (Lecturer only) */}
        {isLecturer && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }, !isDarkTheme && shadow.card]}>
            <View style={styles.cardTitleContainer}>
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
                      style={[styles.primaryButton, {backgroundColor: colors.primary}]}
                      onPress={() => navigation.navigate('Survey', { surveyId: survey.surveyId, moduleCode: survey.name })}
                    >
                      <Ionicons name="sparkles" size={15} color={onPrimaryText} style={{marginRight: 6}} />
                      <Text style={[styles.primaryButtonText, { color: onPrimaryText }]}>Participate</Text>
                    </TouchableOpacity>

                  </View>
                  {index < openSurveys.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              ))
            )}
            </View>
          </View>
        )}

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
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  titleText: { fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: -0.3, flexShrink: 1 },
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
  subtitle: { fontSize: 13, fontFamily: fonts.regular, paddingHorizontal: 0 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15.5, fontFamily: fonts.bold, marginLeft: 4 },
  progressCount: { fontSize: 14, fontFamily: fonts.extraBold, fontVariant: ['tabular-nums'] },
  cardDescription: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 20, marginBottom: 16 },
  assignmentGroup: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  assignmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentTitle: {
    fontSize: 15.5,
    fontFamily: fonts.extraBold,
    marginBottom: 4,
  },
  assignmentStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  assignmentSectionTitle: {
    fontSize: 12,
    fontFamily: fonts.extraBold,
    marginBottom: 4,
  },
  assignmentModuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  progressBarContainer: { marginTop: 8 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressTextLeft: { fontSize: 11.5, fontFamily: fonts.semiBold },
  progressTextRight: { fontSize: 11.5, fontFamily: fonts.semiBold },
  divider: { height: 1, marginVertical: 14 },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleLabel: { fontSize: 11, fontFamily: fonts.bold, marginBottom: 3, letterSpacing: 0.3, textTransform: 'uppercase' },
  moduleCode: { fontSize: 14.5, fontFamily: fonts.semiBold },
  primaryButton: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 15, borderRadius: radii.sm, alignItems: 'center' },
  primaryButtonText: { fontSize: 12.5, fontFamily: fonts.bold },
});
