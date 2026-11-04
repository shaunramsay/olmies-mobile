const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('./surveyCompletion');

const survey = {
  sections: [
    { id: 's1', questions: [{ id: 'q1', type: 'Likert' }, { id: 'q2', type: 'MultipleChoice', choices: ['Yes', 'No'] }] },
    { id: 's2', questions: [{ id: 'q3', type: 'FreeText' }] },
  ],
};

test('every question must be answered (OQA)', () => {
  assert.deepEqual(c.unansweredQuestions(survey, {}).map((q) => q.id), ['q1', 'q2', 'q3']);
  assert.deepEqual(c.unansweredQuestions(survey, { q1: '4', q2: 'Yes' }).map((q) => q.id), ['q3']);
  assert.equal(c.unansweredQuestions(survey, { q1: '4', q2: 'Yes', q3: 'Fine.' }).length, 0);
});

test('blank and whitespace-only answers do not count', () => {
  const answers = { q1: '4', q2: '', q3: '   ' };
  assert.deepEqual(c.unansweredQuestions(survey, answers).map((q) => q.id), ['q2', 'q3']);
  assert.equal(c.answeredCount(survey, answers), 1);
});

test('answers to unrelated questions do not count towards completion', () => {
  assert.equal(c.answeredCount(survey, { other: '5', q1: '3' }), 1);
});

test('messages', () => {
  assert.equal(c.incompleteMessage(2), 'Please answer every question before submitting (2 remaining).');
  assert.equal(c.submissionFailureMessage({ error: 'invalid_answers', message: 'Every question must be answered.' }), 'Every question must be answered.');
  assert.equal(c.submissionFailureMessage({ error: 'Failed to submit survey response.' }), 'Failed to submit survey response.');
  assert.equal(c.submissionFailureMessage(null), 'Failed to submit the survey.');
});
