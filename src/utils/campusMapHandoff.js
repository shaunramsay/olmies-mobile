const LOCATION_INTENT_PATTERNS = [
  /^where\s+(is|are)\b/i,
  /^where'?s\b/i,
  /^where\s+s\b/i,
  /^where\s+can\s+i\s+find\b/i,
  /^where\s+can\s+we\s+find\b/i,
  /^how\s+do\s+i\s+find\b/i,
  /^how\s+can\s+i\s+find\b/i,
  /^location\s+of\b/i,
  /^directions\s+to\b/i,
  /^find\s+(the\s+)?(location\s+of\s+)?/i,
];

const INTENT_PREFIX_PATTERNS = [
  /^where\s+(is|are)\s+/i,
  /^where'?s\s+/i,
  /^where\s+s\s+/i,
  /^where\s+can\s+i\s+find\s+/i,
  /^where\s+can\s+we\s+find\s+/i,
  /^how\s+do\s+i\s+find\s+/i,
  /^how\s+can\s+i\s+find\s+/i,
  /^location\s+of\s+/i,
  /^directions\s+to\s+/i,
  /^find\s+(the\s+)?(location\s+of\s+)?/i,
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'at',
  'campus',
  'in',
  'is',
  'it',
  'jamaica',
  'me',
  'of',
  'on',
  'please',
  'show',
  'the',
  'to',
  'utech',
]);

const normalizeText = (value) => (
  typeof value === 'string'
    ? value
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
    : ''
);

const compactText = (value) => normalizeText(value).replace(/\s+/g, '');

const tokenize = (value) => normalizeText(value)
  .split(' ')
  .filter(token => token && !STOP_WORDS.has(token));

const isCampusMapLocationIntent = (question) => {
  const normalized = normalizeText(question);
  if (!normalized) return false;
  return LOCATION_INTENT_PATTERNS.some(pattern => pattern.test(normalized));
};

const extractCampusMapSearchText = (question) => {
  let searchText = normalizeText(question);
  for (const pattern of INTENT_PREFIX_PATTERNS) {
    searchText = searchText.replace(pattern, '');
  }

  return tokenize(searchText).join(' ');
};

const collectAliases = (poi) => {
  const aliases = [];
  if (Array.isArray(poi?.aliases)) aliases.push(...poi.aliases);
  if (typeof poi?.aliases === 'string') aliases.push(...poi.aliases.split(','));
  if (typeof poi?.alias === 'string') aliases.push(poi.alias);
  return aliases.map(normalizeText).filter(Boolean);
};

const getAssociatedRoomMatches = (searchCompact, associatedRooms) => {
  if (!searchCompact || typeof associatedRooms !== 'string') return [];
  return associatedRooms
    .split(',')
    .map(room => room.trim())
    .filter(Boolean)
    .filter(room => {
      const roomCompact = compactText(room);
      return roomCompact && (roomCompact === searchCompact || roomCompact.includes(searchCompact) || searchCompact.includes(roomCompact));
    });
};

const scorePoiMatch = (question, poi) => {
  const searchText = extractCampusMapSearchText(question);
  const searchCompact = compactText(searchText);
  const tokens = tokenize(searchText);

  if (!searchCompact || tokens.length === 0) return null;

  const name = normalizeText(poi?.name);
  const nameCompact = compactText(poi?.name);
  const description = normalizeText(poi?.description);
  const category = normalizeText(poi?.category);
  const associatedRooms = normalizeText(poi?.associatedRooms);
  const aliases = collectAliases(poi);
  const combined = normalizeText([
    poi?.name,
    poi?.description,
    poi?.category,
    poi?.associatedRooms,
    aliases.join(' '),
  ].filter(Boolean).join(' '));

  const roomMatches = getAssociatedRoomMatches(searchCompact, poi?.associatedRooms);
  let score = 0;
  let reason = '';
  let matchedText = '';

  if (nameCompact === searchCompact) {
    score = 100;
    reason = 'name';
    matchedText = poi?.name || '';
  } else if (aliases.some(alias => compactText(alias) === searchCompact)) {
    score = 96;
    reason = 'alias';
    matchedText = aliases.find(alias => compactText(alias) === searchCompact) || '';
  } else if (roomMatches.length > 0) {
    score = 94;
    reason = 'room';
    matchedText = roomMatches[0];
  } else if (searchCompact.length >= 4 && nameCompact.includes(searchCompact)) {
    score = 88;
    reason = 'name';
    matchedText = poi?.name || '';
  } else if (tokens.length >= 2 && tokens.every(token => name.includes(token))) {
    score = 84;
    reason = 'name';
    matchedText = poi?.name || '';
  } else if (aliases.some(alias => searchCompact.length >= 4 && compactText(alias).includes(searchCompact))) {
    score = 82;
    reason = 'alias';
    matchedText = aliases.find(alias => compactText(alias).includes(searchCompact)) || '';
  } else if (tokens.length >= 2 && tokens.every(token => combined.includes(token))) {
    score = 76;
    reason = 'details';
    matchedText = poi?.description || poi?.associatedRooms || '';
  } else if (searchCompact.length >= 5 && associatedRooms.replace(/\s+/g, '').includes(searchCompact)) {
    score = 74;
    reason = 'room';
    matchedText = poi?.associatedRooms || '';
  } else if (searchCompact.length >= 5 && description.replace(/\s+/g, '').includes(searchCompact)) {
    score = 72;
    reason = 'description';
    matchedText = poi?.description || '';
  } else if (searchCompact.length >= 5 && category.replace(/\s+/g, '') === searchCompact) {
    score = 70;
    reason = 'category';
    matchedText = poi?.category || '';
  }

  if (score < 70) return null;

  return {
    poi,
    score,
    reason,
    matchedText,
  };
};

const findCampusMapMatches = (question, pois, options = {}) => {
  if (!isCampusMapLocationIntent(question) || !Array.isArray(pois) || pois.length === 0) {
    return [];
  }

  const limit = options.limit || 3;
  const scored = pois
    .map(poi => scorePoiMatch(question, poi))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || String(a.poi?.name || '').localeCompare(String(b.poi?.name || '')));

  if (scored.length === 0) return [];

  const topScore = scored[0].score;
  const confidentMatches = scored.filter(match => match.score >= 70 && topScore - match.score <= 18);
  return confidentMatches.slice(0, limit);
};

module.exports = {
  extractCampusMapSearchText,
  findCampusMapMatches,
  isCampusMapLocationIntent,
  scorePoiMatch,
};
