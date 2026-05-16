const DEFAULT_APP_DOWNLOAD_URL = 'https://www.utech.edu.jm/';
const VERIFY_FOOTER = 'Please verify important academic or administrative decisions with the relevant UTech office.';

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeSources = (sources) => {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((source) => normalizeText(source))
    .filter(Boolean);
};

const getAppDownloadUrl = (configuredUrl) => normalizeText(configuredUrl) || DEFAULT_APP_DOWNLOAD_URL;

const isShareableHelpDeskAnswer = (message) => {
  return message?.sender === 'ai' &&
    message?.id !== 'welcome_msg' &&
    message?.type !== 'mapResult' &&
    !message?.isMapResult &&
    !message?.isError &&
    !message?.isLoading &&
    normalizeText(message?.text).length > 0 &&
    normalizeText(message?.questionText).length > 0;
};

const formatHelpDeskShareMessage = (message, options = {}) => {
  const question = normalizeText(message?.questionText);
  const answer = normalizeText(message?.text);
  const appDownloadUrl = getAppDownloadUrl(options.appDownloadUrl);
  const sources = normalizeSources(message?.sources);

  const sections = [
    `Question:\n${question}`,
    `Answer:\n${answer}`,
  ];

  if (sources.length > 0) {
    sections.push(`Sources:\n${sources.map((source) => `- ${source}`).join('\n')}`);
  }

  sections.push(`Shared from UTech Campus Companion.\n${appDownloadUrl}`);
  sections.push(VERIFY_FOOTER);

  return sections.join('\n\n');
};

const formatHelpDeskResponseOnly = (message) => normalizeText(message?.text);

module.exports = {
  DEFAULT_APP_DOWNLOAD_URL,
  VERIFY_FOOTER,
  formatHelpDeskResponseOnly,
  formatHelpDeskShareMessage,
  getAppDownloadUrl,
  isShareableHelpDeskAnswer,
};
