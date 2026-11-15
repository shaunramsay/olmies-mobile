import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui';
import { fonts, radii, spacing } from '../../utils/theme';
const {
  buildSubmission,
  chooseOccurrence,
  initialSelections,
  interpretResponse,
  lecturerLine,
  missingMessage,
  skipTeachingType,
} = require('../../utils/occurrenceEvaluation');

// Occurrence-aware module evaluation (same rules as the portal form; see utils/occurrenceEvaluation).
// The draft lives only in this screen's memory and is kept when the server asks to try again.

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export default function OccurrenceEvaluationScreen({ route, navigation }) {
  const { assignmentId, moduleCode } = route.params;
  const { fetchWithAuth } = useAuth();
  const { colors, isDarkTheme } = useAppTheme();
  const onPrimaryText = isDarkTheme ? '#1A1400' : '#FFFFFF';

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(null);
  const [error, setError] = useState(null);
  const [moduleAnswers, setModuleAnswers] = useState({});
  const [selections, setSelections] = useState({});
  const [occurrenceAnswers, setOccurrenceAnswers] = useState({});
  const [pendingAlternative, setPendingAlternative] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetchWithAuth(`/api/v1/student/evaluations/${assignmentId}/form`);
        const body = await readJson(response);
        if (!active) return;
        const outcome = interpretResponse(response.status, body);
        if (outcome.kind === 'ok') {
          setForm(body);
          setSelections(initialSelections(body));
        } else {
          setBlocked(outcome.message);
        }
      } catch {
        if (active) setBlocked('A network error occurred. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [assignmentId, fetchWithAuth]);

  const hasOccurrenceQuestions = useMemo(
    () => ((form && form.occurrenceSections) || []).some((s) => (s.questions || []).length > 0),
    [form]
  );

  const pick = (activityCode, occurrenceCode) => {
    const result = chooseOccurrence(form, selections, activityCode, occurrenceCode);
    if (result.needsConfirmation) {
      setPendingAlternative({ activityCode, occurrenceCode });
      return;
    }
    setSelections(result.selections);
    setError(null);
  };

  const confirmAlternative = () => {
    const { activityCode, occurrenceCode } = pendingAlternative;
    setSelections(chooseOccurrence(form, selections, activityCode, occurrenceCode, true).selections);
    setPendingAlternative(null);
    setError(null);
  };

  const setAnswer = (occurrenceCode, questionId, value) => {
    setError(null);
    if (occurrenceCode == null) {
      setModuleAnswers((current) => ({ ...current, [questionId]: value }));
    } else {
      setOccurrenceAnswers((current) => ({ ...current, [occurrenceCode]: { ...(current[occurrenceCode] || {}), [questionId]: value } }));
    }
  };

  const submit = async () => {
    const problem = missingMessage(form, moduleAnswers, selections, occurrenceAnswers);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/v1/student/evaluations/${assignmentId}/submission`, {
        method: 'POST',
        body: JSON.stringify(buildSubmission(form, moduleAnswers, selections, occurrenceAnswers)),
      });
      const outcome = interpretResponse(response.status, await readJson(response));
      if (outcome.kind === 'ok') setSubmitted(true);
      else if (outcome.kind === 'blocked') setBlocked(outcome.message);
      else setError(outcome.message); // the draft stays
    } catch {
      setError('The evaluation could not be submitted. Your answers are still here; please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, occurrenceCode) => {
    const answers = occurrenceCode == null ? moduleAnswers : occurrenceAnswers[occurrenceCode] || {};
    const value = answers[question.questionId] || '';
    const type = (question.type || '').toLowerCase();
    let input;
    if (type === 'likert') {
      const min = question.likertMin ?? 1;
      const max = question.likertMax ?? 5;
      const scores = [];
      for (let v = min; v <= max; v += 1) scores.push(v);
      input = (
        <View style={styles.likertContainer} accessibilityRole="radiogroup" accessibilityLabel={question.text}>
          {scores.map((score) => {
            const selected = value === String(score);
            return (
              <TouchableOpacity
                key={score}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={String(score)}
                style={[styles.likertOption, { borderColor: colors.border, backgroundColor: colors.background }, selected && { borderColor: colors.primary, backgroundColor: colors.primaryTint }]}
                onPress={() => setAnswer(occurrenceCode, question.questionId, String(score))}
              >
                <Text style={[styles.likertText, { color: selected ? colors.secondary : colors.textSecondary }]}>{score}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    } else if (type === 'multiplechoice' && (question.choices || []).length > 0) {
      input = (
        <View style={styles.choicesContainer}>
          {question.choices.map((choice) => {
            const selected = value === choice;
            return (
              <TouchableOpacity key={choice} accessibilityRole="radio" accessibilityState={{ selected }}
                style={[styles.choiceButton, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primaryTint : colors.background }]}
                onPress={() => setAnswer(occurrenceCode, question.questionId, choice)}>
                <Text style={[styles.choiceText, { color: colors.text }]}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    } else {
      input = (
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          multiline
          numberOfLines={4}
          maxLength={4000}
          accessibilityLabel={question.text}
          placeholder="Type your answer here..."
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={(text) => setAnswer(occurrenceCode, question.questionId, text)}
        />
      );
    }
    return (
      <View key={`${occurrenceCode || 'module'}-${question.questionId}`} style={[styles.questionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>
        {input}
      </View>
    );
  };

  const header = (
    <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
      <TouchableOpacity style={styles.backButton} accessibilityLabel="Close" onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Module evaluation</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{(form && form.moduleCode) || moduleCode}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (blocked || submitted || !form) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.center}>
          <Text style={[styles.message, { color: colors.text }]}>
            {submitted ? 'Thank you. Your evaluation has been submitted.' : blocked || 'This evaluation is not available.'}
          </Text>
          <Button label="Back to surveys" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {form.moduleName || form.moduleCode} · {form.campaignName}. Your answers are confidential and reported only for groups large enough to protect you.
        </Text>

        {(form.moduleSections || []).map((section) => (
          <View key={section.sectionId} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            {(section.questions || []).map((q) => renderQuestion(q, null))}
          </View>
        ))}

        {hasOccurrenceQuestions && (form.teachingTypes || []).map((type) => {
          const selection = selections[type.activityCode];
          const selected = selection && !selection.skipped ? selection.occurrenceCode : null;
          return (
            <View key={type.activityCode} style={styles.section} accessibilityLabel={type.activityName || type.activityCode}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{type.activityName || type.activityCode}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {type.preselectedOccurrenceCode ? 'Which session did you attend? Your registered session is selected.' : 'Which session did you attend?'}
              </Text>
              {(type.occurrences || []).map((occurrence) => {
                const isSelected = selected === occurrence.occurrenceCode;
                return (
                  <TouchableOpacity
                    key={occurrence.occurrenceCode}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.occurrence, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primaryTint : colors.cardBackground }]}
                    onPress={() => pick(type.activityCode, occurrence.occurrenceCode)}
                  >
                    <Text style={[styles.occurrenceTitle, { color: colors.text }]}>
                      {occurrence.groupCode ? `Group ${occurrence.groupCode}` : occurrence.occurrenceCode}
                      {occurrence.requiresConfirmation ? ' · another group' : ''}
                    </Text>
                    <Text style={[styles.occurrenceDetail, { color: colors.textSecondary }]}>{lecturerLine(occurrence)}</Text>
                  </TouchableOpacity>
                );
              })}
              {form.allowSkipTeachingType && (
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !!(selection && selection.skipped) }}
                  style={[styles.occurrence, { borderColor: selection && selection.skipped ? colors.primary : colors.border, backgroundColor: colors.cardBackground }]}
                  onPress={() => setSelections(skipTeachingType(form, selections, type.activityCode))}
                >
                  <Text style={[styles.occurrenceTitle, { color: colors.text }]}>I did not attend any of these sessions</Text>
                </TouchableOpacity>
              )}
              {selected && (form.occurrenceSections || []).map((section) => (
                <View key={`${selected}-${section.sectionId}`}>
                  {(section.questions || []).map((q) => renderQuestion(q, selected))}
                </View>
              ))}
            </View>
          );
        })}

        {error && (
          <View style={[styles.errorBanner, { borderColor: colors.danger || colors.accent }]} accessibilityLiveRegion="polite">
            <Text style={[styles.errorText, { color: colors.danger || colors.text }]}>{error}</Text>
          </View>
        )}

        <Button label="Submit evaluation" onPress={submit} loading={submitting} fullWidth />
      </ScrollView>

      <Modal transparent visible={!!pendingAlternative} animationType="fade" onRequestClose={() => setPendingAlternative(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>This is not your registered group</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Choose it only if this is the session you actually attended.
            </Text>
            <TouchableOpacity style={[styles.modalPrimary, { backgroundColor: colors.primary }]} onPress={confirmAlternative}>
              <Text style={[styles.modalPrimaryText, { color: onPrimaryText }]}>Yes, I attended this session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondary} onPress={() => setPendingAlternative(null)}>
              <Text style={[styles.modalSecondaryText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 24, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  backButton: { marginRight: 14 },
  headerTitle: { fontSize: 17, fontFamily: fonts.extraBold },
  headerSubtitle: { fontSize: 11.5, fontFamily: fonts.semiBold, marginTop: 2 },
  scrollContent: { padding: spacing.xl, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' },
  intro: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, marginBottom: spacing.lg },
  message: { fontSize: 15, fontFamily: fonts.bold, textAlign: 'center', lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.extraBold, marginBottom: spacing.md },
  hint: { fontSize: 12.5, fontFamily: fonts.regular, marginBottom: spacing.sm },
  questionContainer: { padding: spacing.lg, borderRadius: radii.lg, marginBottom: spacing.md, borderWidth: 1 },
  questionText: { fontSize: 14.5, marginBottom: spacing.md, lineHeight: 21, fontFamily: fonts.bold },
  likertContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  likertOption: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  likertText: { fontFamily: fonts.bold, fontSize: 15 },
  choicesContainer: { gap: 10 },
  choiceButton: { borderWidth: 1.5, padding: 13, borderRadius: radii.md },
  choiceText: { fontSize: 13.5, fontFamily: fonts.medium },
  textInput: { borderWidth: 1.5, borderRadius: radii.sm, padding: 12, textAlignVertical: 'top', fontSize: 14, fontFamily: fonts.regular },
  occurrence: { borderWidth: 1.5, borderRadius: radii.md, padding: 13, marginBottom: spacing.sm },
  occurrenceTitle: { fontSize: 14, fontFamily: fonts.bold },
  occurrenceDetail: { fontSize: 12.5, fontFamily: fonts.regular, marginTop: 2 },
  errorBanner: { borderWidth: 1.5, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: 13.5, lineHeight: 19, fontFamily: fonts.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(14,0,78,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { borderRadius: radii.xl, padding: 24, width: '85%', maxWidth: 420 },
  modalTitle: { fontSize: 17, fontFamily: fonts.extraBold, marginBottom: 8 },
  modalText: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20, marginBottom: 18 },
  modalPrimary: { paddingVertical: 12, borderRadius: radii.pill, alignItems: 'center' },
  modalPrimaryText: { fontSize: 14, fontFamily: fonts.bold },
  modalSecondary: { paddingVertical: 12, alignItems: 'center' },
  modalSecondaryText: { fontSize: 14, fontFamily: fonts.bold },
});
