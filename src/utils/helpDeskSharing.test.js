const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_APP_DOWNLOAD_URL,
  VERIFY_FOOTER,
  formatHelpDeskResponseOnly,
  formatHelpDeskShareMessage,
  getAppDownloadUrl,
  isShareableHelpDeskAnswer,
} = require('./helpDeskSharing');

test('formats share text with question, answer, source, app link, and disclaimer', () => {
  const message = {
    id: 'answer-1',
    sender: 'ai',
    questionText: 'When do exams start?',
    text: 'Exam dates are published by the Registry.',
    sources: ['Student Handbook 2024/2025, page 129'],
  };

  const shared = formatHelpDeskShareMessage(message, {
    appDownloadUrl: 'https://download.test/app',
  });

  assert.equal(shared, [
    'Question:\nWhen do exams start?',
    'Answer:\nExam dates are published by the Registry.',
    'Sources:\n- Student Handbook 2024/2025, page 129',
    'Shared from UTech Campus Companion.\nhttps://download.test/app',
    VERIFY_FOOTER,
  ].join('\n\n'));
});

test('omits sources when none are available', () => {
  const shared = formatHelpDeskShareMessage({
    id: 'answer-1',
    sender: 'ai',
    questionText: 'How do I register?',
    text: 'Follow the registration instructions in the student portal.',
    sources: [],
  });

  assert.ok(!shared.includes('Sources:'));
  assert.ok(shared.includes(DEFAULT_APP_DOWNLOAD_URL));
});

test('uses configured app URL or safe fallback', () => {
  assert.equal(getAppDownloadUrl('https://download.test/app'), 'https://download.test/app');
  assert.equal(getAppDownloadUrl('   '), DEFAULT_APP_DOWNLOAD_URL);
});

test('only completed paired AI answers are shareable', () => {
  assert.equal(isShareableHelpDeskAnswer({
    id: 'answer-1',
    sender: 'ai',
    questionText: 'Question',
    text: 'Answer',
  }), true);

  assert.equal(isShareableHelpDeskAnswer({ id: 'welcome_msg', sender: 'ai', text: 'Welcome' }), false);
  assert.equal(isShareableHelpDeskAnswer({ id: 'answer-2', sender: 'ai', text: 'Answer' }), false);
  assert.equal(isShareableHelpDeskAnswer({ id: 'answer-3', sender: 'ai', questionText: 'Question', text: 'Error', isError: true }), false);
  assert.equal(isShareableHelpDeskAnswer({ id: 'answer-4', sender: 'ai', questionText: 'Question', text: 'Loading', isLoading: true }), false);
  assert.equal(isShareableHelpDeskAnswer({ id: 'user-1', sender: 'user', text: 'Question' }), false);
});

test('formats response-only copy text as the answer body', () => {
  assert.equal(formatHelpDeskResponseOnly({ text: '  Answer text  ' }), 'Answer text');
});
