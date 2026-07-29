import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Button, ProgressBar } from '../../components/ui';
import { fonts, radii, spacing } from '../../utils/theme';

export default function SurveyScreen({ route, navigation }) {
  const { surveyId, moduleCode, moduleOfferingId, campaignId, surveyWindowId, assignmentId } = route.params;
  const { fetchWithAuth, getDeviceId } = useAuth();
  const { colors, isDarkTheme } = useAppTheme();
  const onPrimaryText = isDarkTheme ? '#1A1400' : '#FFFFFF';

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetchWithAuth(`/api/v1/execution/surveys/${surveyId}`);
        if (response.ok) {
          const data = await response.json();
          setSurvey(data);
        } else {
          setError('Failed to load the survey. It may be inactive or locked.');
        }
      } catch (err) {
        console.error('Error fetching survey details:', err);
        setError('A network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, fetchWithAuth]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const totalQuestions = useMemo(
    () => (survey?.sections || []).reduce((sum, s) => sum + (s.questions?.length || 0), 0),
    [survey]
  );
  const answeredCount = useMemo(
    () => Object.values(answers).filter(v => v !== '' && v != null).length,
    [answers]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const payload = {
        surveyId: surveyId,
        answers: answers,
        deviceId: deviceId
      };

      if (moduleOfferingId) {
        payload.moduleOfferingId = moduleOfferingId;
      }

      if (campaignId) {
        payload.campaignId = campaignId;
      }

      if (surveyWindowId) {
        payload.surveyWindowId = surveyWindowId;
      }

      if (assignmentId) {
        payload.assignmentId = assignmentId;
      }

      const response = await fetchWithAuth('/api/v1/execution/responses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowSuccessModal(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
        ]).start();

        setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
            setShowSuccessModal(false);
            navigation.goBack();
          });
        }, 2200);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to submit the survey.');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      alert('An unexpected error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    // Determine the type from Question
    // In our backend it might be "Likert", "FreeText", "MultipleChoice"
    const type = question.type || question.Type || '';
    const currentAnswer = answers[question.id] || '';

    switch (type.toLowerCase()) {
      case 'likert':
        // For Likert scale, typically 1 to 5
        return (
          <View style={styles.likertContainer}>
            {[1, 2, 3, 4, 5].map(score => {
              const selected = currentAnswer === score.toString();
              return (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.likertOption,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryTint }
                  ]}
                  onPress={() => handleAnswerChange(question.id, score.toString())}
                >
                  <Text style={[
                    styles.likertText,
                    { color: colors.textSecondary },
                    selected && { color: colors.secondary }
                  ]}>{score}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'multiplechoice':
        return (
          <View style={styles.choicesContainer}>
            {(question.choices || []).map(choice => {
              const selected = currentAnswer === choice;
              return (
                <TouchableOpacity
                  key={choice}
                  style={[
                    styles.choiceButton,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryTint }
                  ]}
                  onPress={() => handleAnswerChange(question.id, choice)}
                >
                  <View style={[styles.radioDot, { borderColor: selected ? colors.primary : colors.border }]}>
                    {selected && <View style={[styles.radioDotFill, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[
                    styles.choiceText,
                    { color: colors.text },
                    selected && { fontFamily: fonts.bold }
                  ]}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'freetext':
      default:
        return (
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            multiline
            numberOfLines={4}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.textSecondary}
            value={currentAnswer}
            onChangeText={(text) => handleAnswerChange(question.id, text)}
          />
        );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 15, fontFamily: fonts.regular }}>Loading your survey...</Text>
      </View>
    );
  }

  if (error || !survey) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={44} color={colors.danger} style={{ marginBottom: 10 }} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Survey content is unavailable.'}</Text>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{survey.title || moduleCode + ' Evaluation'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{moduleCode} · {survey.sections?.length || 0} sections</Text>
        </View>
        {totalQuestions > 0 && (
          <Text style={[styles.headerCount, { color: colors.text }]}>{answeredCount} / {totalQuestions}</Text>
        )}
      </View>

      {totalQuestions > 0 && (
        <View style={[styles.progressDock, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <ProgressBar progress={totalQuestions ? answeredCount / totalQuestions : 0} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {(!survey.sections || survey.sections.length === 0) ? (
          <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 20 }}>
            <Ionicons name="document-text-outline" size={54} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 15, textAlign: 'center', lineHeight: 22, fontFamily: fonts.regular }}>
              This survey is currently empty or has not been fully configured yet. Please check back later!
            </Text>
          </View>
        ) : (
          <>
            {survey.sections.map((section, idx) => (
              <View key={section.id || idx} style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { backgroundColor: colors.primaryTint, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                  {section.instructions && (
                    <Text style={[styles.sectionInstructions, { color: colors.textSecondary }]}>{section.instructions}</Text>
                  )}
                </View>

                {(section.questions || []).map((question, qIdx) => (
                  <View key={question.id || qIdx} style={[styles.questionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.questionText, { color: colors.text }]}>
                      {qIdx + 1}. {question.text}
                    </Text>
                    {renderQuestionInput(question)}
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.footer}>
              <Button
                label={submitting ? 'Submitting...' : 'Submit Evaluation'}
                icon={submitting ? undefined : 'paper-plane-outline'}
                loading={submitting}
                onPress={handleSubmit}
                fullWidth
                style={styles.submitButton}
              />
            </View>

            <Modal visible={showSuccessModal} transparent animationType="none">
              <View style={styles.modalOverlay}>
                <Animated.View style={[styles.successCard, { backgroundColor: colors.cardBackground, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                  <View style={[styles.checkmarkCircle, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark-sharp" size={50} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.successTitle, { color: colors.text }]}>Thank You!</Text>
                  <Text style={[styles.successMessage, { color: colors.textSecondary }]}>Your response has been successfully recorded.</Text>
                </Animated.View>
              </View>
            </Modal>
          </>
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
  headerSubtitle: { fontSize: 11.5, fontFamily: fonts.semiBold, marginTop: 2 },
  headerCount: { fontSize: 13, fontFamily: fonts.bold, fontVariant: ['tabular-nums'], marginLeft: spacing.sm },
  progressDock: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' },
  sectionContainer: { marginBottom: 28 },
  sectionHeader: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.extraBold },
  sectionInstructions: { fontSize: 12.5, fontFamily: fonts.regular, marginTop: 4, fontStyle: 'italic' },
  questionContainer: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  questionText: { fontSize: 14.5, marginBottom: spacing.md, lineHeight: 21, fontFamily: fonts.bold },

  // Free text
  textInput: {
    borderWidth: 1.5,
    borderRadius: radii.sm,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  // Likert
  likertContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  likertOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likertText: { fontFamily: fonts.bold, fontSize: 15 },

  // Multiple Choice
  choicesContainer: { gap: 10 },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    padding: 13,
    borderRadius: radii.md,
  },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDotFill: { width: 9, height: 9, borderRadius: 5 },
  choiceText: { fontSize: 13.5, fontFamily: fonts.medium, flexShrink: 1 },

  footer: { marginTop: 12, alignItems: 'center', maxWidth: 720, width: '100%', alignSelf: 'center' },
  submitButton: { paddingVertical: 14, borderRadius: radii.pill },

  errorText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20, fontFamily: fonts.regular },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.sm,
  },
  secondaryButtonText: { fontSize: 13.5, fontFamily: fonts.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(14,0,78,0.6)', justifyContent: 'center', alignItems: 'center' },
  successCard: { borderRadius: radii.xl, padding: 32, width: '85%', alignItems: 'center', shadowColor: '#0E004E', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 },
  checkmarkCircle: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  successTitle: { fontSize: 22, fontFamily: fonts.extraBold, marginBottom: 10 },
  successMessage: { fontSize: 14.5, textAlign: 'center', lineHeight: 21, fontFamily: fonts.regular }
});
