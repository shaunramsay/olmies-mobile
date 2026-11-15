const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('./loginPolicy');

const tenantId = '11111111-2222-3333-4444-555555555555';
const clientId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

test('only the methods the server offers are shown', () => {
  assert.deepEqual(policy.signInOptions({ entra: { tenantId, clientId }, synthetic: false }),
    { entra: { tenantId, clientId }, password: false });
  assert.deepEqual(policy.signInOptions({ entra: null, synthetic: true }), { entra: null, password: true });
  assert.deepEqual(policy.signInOptions(null), { entra: null, password: false });
  assert.deepEqual(policy.signInOptions({ synthetic: 'true' }), { entra: null, password: false });
});

test('malformed Entra configuration is ignored', () => {
  assert.equal(policy.signInOptions({ entra: { tenantId: 'common', clientId } }).entra, null);
  assert.equal(policy.signInOptions({ entra: { tenantId, clientId: '' } }).entra, null);
});

test('the app never sends a role (SC-05)', () => {
  assert.equal('role' in policy.passwordSignInBody(' sim-student-001 ', 'pw', 'dev-1'), false);
  assert.equal(policy.passwordSignInBody(' sim-student-001 ', 'pw', 'dev-1').username, 'sim-student-001');
  assert.deepEqual(Object.keys(policy.entraSignInBody('tok', 'dev-1')).sort(), ['deviceId', 'idToken']);
});

test('no demo credentials or testing endpoint remain in the app (SC-07)', () => {
  const source = require('fs').readFileSync(require.resolve('../screens/auth/LoginScreen.js'), 'utf8');
  for (const forbidden of ['student123', 'lecturer123', '/auth/testing/login', "role:"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test('failure messages', () => {
  assert.equal(policy.failureMessage(503, { error: 'institutional_sign_in_unavailable' }), policy.SIGN_IN_UNAVAILABLE_MESSAGE);
  assert.match(policy.failureMessage(429, {}), /15 minutes/);
  assert.equal(policy.failureMessage(403, { error: 'No current student enrolment was found for this account.' }),
    'No current student enrolment was found for this account.');
  assert.equal(policy.issuer, undefined);
  assert.equal(policy.entraIssuer(tenantId), `https://login.microsoftonline.com/${tenantId}/v2.0`);
});

test('an ISAS outage at sign-in explains that public services still work', () => {
  const { failureMessage, ACADEMIC_RECORD_UNAVAILABLE_MESSAGE } = require('./loginPolicy');
  assert.equal(failureMessage(503, { error: 'academic_record_unavailable' }), ACADEMIC_RECORD_UNAVAILABLE_MESSAGE);
  assert.match(ACADEMIC_RECORD_UNAVAILABLE_MESSAGE, /campus map/);
  assert.equal(failureMessage(403, { error: 'No current student enrolment was found for this account.' }),
    'No current student enrolment was found for this account.');
});
