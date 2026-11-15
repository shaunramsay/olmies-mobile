const test = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluateApiBaseUrl,
  resolveApiRequestUrl,
  loadApprovedOrigins,
  isReleaseBuildEnvironment,
} = require('./apiDestinationPolicy');

const TEST_API = 'https://olmies-ai-test.up.railway.app';

// ── positive: legitimate destinations keep working ──────────────────────────────────────────

test('release builds accept the approved TEST API (with or without a trailing slash)', () => {
  assert.deepEqual(evaluateApiBaseUrl(TEST_API, { release: true }), { ok: true, baseUrl: TEST_API });
  assert.deepEqual(evaluateApiBaseUrl(`${TEST_API}/`, { release: true }), { ok: true, baseUrl: TEST_API });
});

test('development builds keep loopback, emulator and private-LAN HTTP APIs', () => {
  for (const url of ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://10.0.2.2:5000', 'http://192.168.1.20:5000', 'http://172.20.0.5:5000']) {
    assert.equal(evaluateApiBaseUrl(url, { release: false }).ok, true, url);
  }
});

test('development builds may leave the URL unset so the local fallback is used', () => {
  assert.deepEqual(evaluateApiBaseUrl('', { release: false }), { ok: true, baseUrl: '' });
});

test('relative API paths and same-origin absolute API URLs resolve as before', () => {
  assert.equal(resolveApiRequestUrl(TEST_API, '/api/v1/auth/login'), `${TEST_API}/api/v1/auth/login`);
  assert.equal(resolveApiRequestUrl(TEST_API, 'api/v1/mobile/modules'), `${TEST_API}/api/v1/mobile/modules`);
  assert.equal(resolveApiRequestUrl(TEST_API, `${TEST_API}/api/v1/mobile/modules?x=1`), `${TEST_API}/api/v1/mobile/modules?x=1`);
  assert.equal(resolveApiRequestUrl('http://10.0.2.2:5000', '/api/v1/auth/methods'), 'http://10.0.2.2:5000/api/v1/auth/methods');
});

// ── negative: credentials can never be sent to an unapproved destination ────────────────────

test('the retired legacy Railway host is refused in every build type', () => {
  for (const release of [true, false]) {
    const result = evaluateApiBaseUrl('https://olmies-ai-production.up.railway.app', { release });
    assert.equal(result.ok, false);
    assert.equal(result.baseUrl, '');
    assert.match(result.reason, /retired/);
  }
});

test('release builds refuse missing, unknown, plain-HTTP and look-alike destinations', () => {
  for (const url of [
    '',
    'undefined',
    'https://attacker.example',
    'http://olmies-ai-test.up.railway.app',
    'http://localhost:5000',
    'http://192.168.1.20:5000',
    'https://olmies-ai-test.up.railway.app.attacker.example',
    'https://attacker.example/olmies-ai-test.up.railway.app',
    'https://olmies-ai-test.up.railway.app:8443',
  ]) {
    assert.equal(evaluateApiBaseUrl(url, { release: true }).ok, false, url);
  }
});

test('development builds refuse public plain HTTP but keep developer HTTPS tunnels', () => {
  assert.equal(evaluateApiBaseUrl('http://attacker.example', { release: false }).ok, false);
  assert.deepEqual(evaluateApiBaseUrl('https://dev-tunnel.example', { release: false }), { ok: true, baseUrl: 'https://dev-tunnel.example' });
  assert.equal(evaluateApiBaseUrl('https://dev-tunnel.example', { release: true }).ok, false);
});

test('destinations with credentials, paths, queries or fragments are refused without echoing secrets', () => {
  const withCredentials = evaluateApiBaseUrl('https://user:secret-value@olmies-ai-test.up.railway.app', { release: true });
  assert.equal(withCredentials.ok, false);
  assert.doesNotMatch(withCredentials.reason, /secret-value|user/);
  for (const url of [`${TEST_API}/api/v1`, `${TEST_API}?redirect=x`, `${TEST_API}#x`, 'not a url']) {
    assert.equal(evaluateApiBaseUrl(url, { release: true }).ok, false, url);
  }
});

test('absolute request URLs cannot redirect a token to another host or outside /api/', () => {
  for (const path of [
    'https://attacker.example/api/v1/auth/refresh',
    'https://olmies-ai-production.up.railway.app/api/v1/auth/login',
    '//attacker.example/api/v1/x',
    '\\\\attacker.example/api/v1/x',
    `${TEST_API}/not-api`,
    'https://user:pw@olmies-ai-test.up.railway.app/api/v1/x',
  ]) {
    assert.throws(() => resolveApiRequestUrl(TEST_API, path), /approved API|destination/, path);
  }
});

test('no request is built when the destination is not configured or not approved', () => {
  assert.throws(() => resolveApiRequestUrl('', '/api/v1/auth/login'), /not configured or not approved/);
});

// ── the approvals document itself ───────────────────────────────────────────────────────────

test('the committed approvals document lists only the reviewed TEST API', () => {
  assert.deepEqual([...loadApprovedOrigins()], [TEST_API]);
});

test('malformed approval documents are rejected rather than trusted', () => {
  const bad = [
    null,
    { version: 2, approvals: [] },
    { version: 1, approvals: [{ apiOrigin: TEST_API }] },
    { version: 1, approvals: [{ apiOrigin: 'http://plain.example', approvalRef: 'x' }] },
    { version: 1, approvals: [{ apiOrigin: `${TEST_API}/api`, approvalRef: 'x' }] },
    { version: 1, approvals: [{ apiOrigin: 'https://olmies-ai-production.up.railway.app', approvalRef: 'x' }] },
    { version: 1, approvals: [{ apiOrigin: TEST_API, approvalRef: 'a' }, { apiOrigin: TEST_API, approvalRef: 'b' }] },
  ];
  for (const document of bad) {
    assert.throws(() => loadApprovedOrigins(document), Error);
  }
});

test('release enforcement applies to EAS preview and production builds, not to local tooling', () => {
  assert.equal(isReleaseBuildEnvironment({ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'preview' }), true);
  assert.equal(isReleaseBuildEnvironment({ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'production' }), true);
  assert.equal(isReleaseBuildEnvironment({ EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'development' }), false);
  assert.equal(isReleaseBuildEnvironment({ OLMIES_ENFORCE_API_DESTINATION: 'true', EAS_BUILD_PROFILE: 'production' }), true);
  assert.equal(isReleaseBuildEnvironment({}), false);
});
