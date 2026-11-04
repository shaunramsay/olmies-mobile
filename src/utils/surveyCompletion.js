// OQA requirement: taking part in a survey is voluntary, but a submitted survey must answer every
// question. Blank or whitespace-only answers do not count. The API enforces the same rule; this
// helper lets the app point the student at the unanswered questions before sending anything.

const isAnswered = (answers, question) => {
  const value = answers ? answers[question.id] : undefined;
  return value !== undefined && value !== null && String(value).trim() !== '';
};

const allQuestions = (survey) =>
  ((survey && survey.sections) || []).reduce((list, s) => list.concat(s.questions || []), []);

const unansweredQuestions = (survey, answers) =>
  allQuestions(survey).filter((q) => !isAnswered(answers, q));

const answeredCount = (survey, answers) =>
  allQuestions(survey).filter((q) => isAnswered(answers, q)).length;

const incompleteMessage = (remaining) =>
  `Please answer every question before submitting (${remaining} remaining).`;

/** Message for a failed submission; the server's own text is used for incomplete answers. */
const submissionFailureMessage = (body) => {
  if (body && body.error === 'invalid_answers' && body.message) return body.message;
  return (body && (body.message || body.error)) || 'Failed to submit the survey.';
};

module.exports = { isAnswered, allQuestions, unansweredQuestions, answeredCount, incompleteMessage, submissionFailureMessage };
