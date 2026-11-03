const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveUpdates, isSafeUpdatesConfig } = require('./updatePolicy');

const base = { url: 'https://u.expo.dev/example' };
const noCert = () => false;
const withCert = () => true;

test('production without a signing certificate disables OTA updates', () => {
  const updates = resolveUpdates(base, { EAS_BUILD_PROFILE: 'production' }, '/p', noCert);
  assert.equal(updates.enabled, false);
  assert.ok(isSafeUpdatesConfig(updates));
});

test('production cannot opt in to unsigned updates', () => {
  const updates = resolveUpdates(base, { EAS_BUILD_PROFILE: 'production', OLMIES_ALLOW_UNSIGNED_UPDATES: 'true' }, '/p', noCert);
  assert.equal(updates.enabled, false);
});

test('default (no profile, no certificate) is fail-closed', () => {
  assert.equal(resolveUpdates(base, {}, '/p', noCert).enabled, false);
});

test('a non-production build may explicitly opt in to unsigned updates for testing', () => {
  const updates = resolveUpdates(base, { EAS_BUILD_PROFILE: 'preview', OLMIES_ALLOW_UNSIGNED_UPDATES: 'true' }, '/p', noCert);
  assert.equal(updates.enabled, true);
  assert.equal(isSafeUpdatesConfig(updates), false);
});

test('with a certificate, updates are enabled and must be signed', () => {
  const updates = resolveUpdates(base, { EAS_BUILD_PROFILE: 'production' }, '/p', withCert);
  assert.equal(updates.enabled, true);
  assert.equal(updates.codeSigningCertificate, './certs/certificate.pem');
  assert.deepEqual(updates.codeSigningMetadata, { keyid: 'main', alg: 'rsa-v1_5-sha256' });
  assert.ok(isSafeUpdatesConfig(updates));
});
