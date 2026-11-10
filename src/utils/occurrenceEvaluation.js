// Occurrence-aware module evaluation (OLMIES API: GET /api/v1/student/evaluations,
// GET /api/v1/student/evaluations/{id}/form, POST /api/v1/student/evaluations/{id}/submission).
//
// Pure helpers shared by the evaluations list and the evaluation screen, mirroring the portal's
// OccurrenceEvaluationForm. The rules:
//   * module questions are answered once;
//   * for each ISAS teaching type the student chooses the session they attended. The registered
//     occurrence is preselected when ISAS identifies it; several sessions in the student's own group
//     need a choice but no confirmation; another group's session needs an explicit confirmation;
//   * occurrence (session) questions are answered for the chosen session only;
//   * a teaching type may be skipped only when the campaign allows it.
// The draft stays in memory. The server re-checks every rule against ISAS and is authoritative.
// The app never sends or shows a student number.

const STATUS_LABEL = { ToDo: 'To do', Completed: 'Completed', Closed: 'Closed', Withdrawn: 'Withdrawn' };
const STATUS_TONE = { ToDo: 'warning', Completed: 'success', Closed: 'neutral', Withdrawn: 'neutral' };

const STATE_MESSAGES = {
  AlreadySubmitted: 'This evaluation was already submitted.',
  NoLongerRegistered: 'Your registration for this module changed, so this evaluation is no longer available.',
  Closed: 'This evaluation is not open.',
  Unavailable: "Your academic record could not be checked with the university's records right now. Your answers are still here; please try again later.",
  NotEligible: "The university's records no longer show a current student enrolment for this account.",
  NotFound: 'This evaluation was not found.',
  Failed: 'The evaluation could not be submitted. Your answers are still here; please try again.',
};

const ACADEMIC_RECORD_UNAVAILABLE = 'academic_record_unavailable';
const STUDENT_NOT_ELIGIBLE = 'student_not_eligible';

const text = (value) => (value === undefined || value === null ? '' : String(value)).trim();

const typeName = (type) => type.activityName || type.activityCode;

const questionIds = (sections) =>
  (sections || []).reduce((ids, section) => ids.concat((section.questions || []).map((q) => q.questionId)), []);

/** Initial selection per teaching type: the registered occurrence when ISAS identifies it. */
const initialSelections = (form) => {
  const selections = {};
  ((form && form.teachingTypes) || []).forEach((type) => {
    if (type.preselectedOccurrenceCode) {
      selections[type.activityCode] = { occurrenceCode: type.preselectedOccurrenceCode, confirmed: false };
    }
  });
  return selections;
};

const findOccurrence = (form, activityCode, occurrenceCode) => {
  const type = ((form && form.teachingTypes) || []).find((t) => t.activityCode === activityCode);
  return type ? (type.occurrences || []).find((o) => o.occurrenceCode === occurrenceCode) || null : null;
};

/**
 * What choosing an occurrence does. Returns { needsConfirmation, selections }: when another
 * group's session is chosen and not yet confirmed, the selection is left unchanged so the screen
 * can ask first.
 */
const chooseOccurrence = (form, selections, activityCode, occurrenceCode, confirmed = false) => {
  const occurrence = findOccurrence(form, activityCode, occurrenceCode);
  if (!occurrence) return { needsConfirmation: false, selections };
  if (occurrence.requiresConfirmation && !confirmed) return { needsConfirmation: true, selections };
  return {
    needsConfirmation: false,
    selections: { ...selections, [activityCode]: { occurrenceCode, confirmed: !!occurrence.requiresConfirmation } },
  };
};

const skipTeachingType = (form, selections, activityCode) =>
  form && form.allowSkipTeachingType ? { ...selections, [activityCode]: { skipped: true } } : selections;

/** The first problem that stops submission, as a message for the student; null when complete. */
const missingMessage = (form, moduleAnswers, selections, occurrenceAnswers) => {
  if (!form) return 'The evaluation has not loaded yet.';
  if (questionIds(form.moduleSections).some((id) => !text((moduleAnswers || {})[id]))) return 'Answer every module question.';
  const occurrenceQuestionIds = questionIds(form.occurrenceSections);
  if (occurrenceQuestionIds.length === 0) return null;
  for (const type of form.teachingTypes || []) {
    const selection = (selections || {})[type.activityCode];
    if (!selection) return `Choose the ${typeName(type)} session you attended.`;
    if (selection.skipped) continue;
    const answers = (occurrenceAnswers || {})[selection.occurrenceCode] || {};
    if (occurrenceQuestionIds.some((id) => !text(answers[id]))) return `Answer every question about the ${typeName(type)} session.`;
  }
  return null;
};

/** The request body for POST …/submission. */
const buildSubmission = (form, moduleAnswers, selections, occurrenceAnswers) => {
  const hasOccurrenceQuestions = questionIds(form && form.occurrenceSections).length > 0;
  const chosen = Object.entries(selections || {}).filter(([, s]) => s && !s.skipped);
  return {
    moduleAnswers: { ...(moduleAnswers || {}) },
    selections: hasOccurrenceQuestions || chosen.length > 0
      ? chosen.map(([activityCode, s]) => ({ activityCode, occurrenceCode: s.occurrenceCode, confirmedAlternative: !!s.confirmed }))
      : [],
    occurrenceAnswers: hasOccurrenceQuestions
      ? chosen.reduce((list, [, s]) => list.concat(
          Object.entries((occurrenceAnswers || {})[s.occurrenceCode] || {})
            .map(([questionId, value]) => ({ occurrenceCode: s.occurrenceCode, questionId, value }))), [])
      : [],
  };
};

/**
 * How a response from the form or submission endpoint should be shown.
 *   { kind: 'ok' }                         success
 *   { kind: 'blocked', message }           the evaluation cannot be continued (drop the draft)
 *   { kind: 'retry', message }             keep the draft and let the student try again
 */
const interpretResponse = (status, body) => {
  if (status >= 200 && status < 300) return { kind: 'ok' };
  const code = body && (body.code || body.error);
  if (code === 'AlreadySubmitted' || code === 'NoLongerRegistered' || code === 'Closed') {
    return { kind: 'blocked', message: STATE_MESSAGES[code] };
  }
  if (status === 409) return { kind: 'blocked', message: STATE_MESSAGES.AlreadySubmitted };
  if (status === 404) return { kind: 'blocked', message: STATE_MESSAGES.NotFound };
  if (status === 403 || code === STUDENT_NOT_ELIGIBLE) return { kind: 'blocked', message: STATE_MESSAGES.NotEligible };
  if (status === 503 || code === ACADEMIC_RECORD_UNAVAILABLE || code === 'Unavailable') {
    return { kind: 'retry', message: STATE_MESSAGES.Unavailable };
  }
  if (status === 400) {
    const serverMessage = body && typeof body.error === 'string' && body.error !== code ? body.error : body && body.message;
    return { kind: 'retry', message: serverMessage || STATE_MESSAGES.Failed };
  }
  return { kind: 'retry', message: STATE_MESSAGES.Failed };
};

/** Normalises GET /student/evaluations for display. */
const evaluationList = (body) => ({
  evaluations: ((body && body.evaluations) || []).map((e) => ({
    ...e,
    statusLabel: STATUS_LABEL[e.status] || e.status,
    statusTone: STATUS_TONE[e.status] || 'neutral',
    canStart: e.status === 'ToDo',
  })),
  unavailable: (body && body.unavailableCampaigns) || [],
});

const lecturerLine = (occurrence) =>
  occurrence && occurrence.lecturerNames && occurrence.lecturerNames.length > 0
    ? occurrence.lecturerNames.join(', ')
    : 'Lecturer not recorded';

module.exports = {
  ACADEMIC_RECORD_UNAVAILABLE,
  STATE_MESSAGES,
  STUDENT_NOT_ELIGIBLE,
  buildSubmission,
  chooseOccurrence,
  evaluationList,
  initialSelections,
  interpretResponse,
  lecturerLine,
  missingMessage,
  questionIds,
  skipTeachingType,
};
