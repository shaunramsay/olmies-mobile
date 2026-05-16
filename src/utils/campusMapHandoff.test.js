const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractCampusMapSearchText,
  findCampusMapMatches,
  isCampusMapLocationIntent,
} = require('./campusMapHandoff');

const pois = [
  {
    id: 'library',
    name: 'Calvin McKain Library',
    category: 'Building',
    description: 'Main university library with quiet study zones.',
    associatedRooms: 'Quiet Room A, Quiet Room B, IT Helpdesk',
  },
  {
    id: 'shared-facilities',
    name: 'Shared Facilities',
    category: 'Building',
    description: 'Main computing labs and lecture theaters.',
    associatedRooms: 'LT-48, LT-49, LT-50, Restroom, Classroom Block',
  },
  {
    id: 'student-services',
    name: 'Student Services',
    category: 'Office',
    description: 'Student support, bursary, welfare, and advisory services.',
    associatedRooms: 'Bursary, Student Financing',
  },
  {
    id: 'engineering',
    name: 'Faculty of Engineering and Computing',
    category: 'Building',
    description: 'Engineering faculty offices and computing labs.',
  },
];

test('detects only obvious location intent phrases', () => {
  assert.equal(isCampusMapLocationIntent('Where is the library?'), true);
  assert.equal(isCampusMapLocationIntent('Where can I find student services?'), true);
  assert.equal(isCampusMapLocationIntent('Location of the Faculty of Engineering'), true);
  assert.equal(isCampusMapLocationIntent('How do I find the auditorium?'), true);
  assert.equal(isCampusMapLocationIntent('Directions to the bursary'), true);

  assert.equal(isCampusMapLocationIntent('What is the GPA requirement?'), false);
  assert.equal(isCampusMapLocationIntent('Can I appeal a grade?'), false);
  assert.equal(isCampusMapLocationIntent('Where can I get help with fees?'), false);
});

test('extracts useful map search text from location questions', () => {
  assert.equal(extractCampusMapSearchText('Where is the library?'), 'library');
  assert.equal(extractCampusMapSearchText('Location of the Faculty of Engineering'), 'faculty engineering');
});

test('finds a confident POI name match', () => {
  const matches = findCampusMapMatches('Where is the library?', pois);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].poi.id, 'library');
});

test('finds associated room matches', () => {
  const matches = findCampusMapMatches('Where is LT-48?', pois);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].poi.id, 'shared-facilities');
  assert.equal(matches[0].reason, 'room');
});

test('finds multi-token details matches', () => {
  const matches = findCampusMapMatches('Where can I find student services?', pois);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].poi.id, 'student-services');
});

test('returns multiple matches only when each is confident', () => {
  const matches = findCampusMapMatches('Where is quiet room?', pois);
  assert.ok(matches.length >= 1);
  assert.equal(matches[0].poi.id, 'library');
});

test('falls back when query is uncertain or no POI is confident', () => {
  assert.deepEqual(findCampusMapMatches('What are the library opening hours?', pois), []);
  assert.deepEqual(findCampusMapMatches('Where is the imaginary office?', pois), []);
  assert.deepEqual(findCampusMapMatches('Where is the library?', []), []);
});
