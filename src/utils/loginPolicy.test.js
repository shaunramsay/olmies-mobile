const test = require('node:test');
const assert = require('node:assert/strict');

const policy = require('./loginPolicy');
const loadPolicy = async () => policy;

test('demo accounts are hidden in every non-development build (SC-07)', async () => {
  const { shouldShowDemoAccounts } = await loadPolicy();
  assert.equal(shouldShowDemoAccounts(false), false);
  assert.equal(shouldShowDemoAccounts(undefined), false);
  assert.equal(shouldShowDemoAccounts('true'), false);
  assert.equal(shouldShowDemoAccounts(true), true);
});

test('a release build never routes to the synthetic testing login', async () => {
  const { loginEndpointFor } = await loadPolicy();
  assert.equal(loginEndpointFor('test_student', false), '/api/v1/auth/login');
  assert.equal(loginEndpointFor('test_lecturer', false), '/api/v1/auth/login');
  assert.equal(loginEndpointFor('test_student', true), '/api/v1/auth/testing/login');
  assert.equal(loginEndpointFor('2001234', true), '/api/v1/auth/login');
});

test('the disabled sign-in response is recognised', async () => {
  const { isSignInUnavailable } = await loadPolicy();
  assert.equal(isSignInUnavailable(503, { error: 'institutional_sign_in_unavailable' }), true);
  assert.equal(isSignInUnavailable(503, {}), false);
  assert.equal(isSignInUnavailable(401, { error: 'institutional_sign_in_unavailable' }), false);
});
