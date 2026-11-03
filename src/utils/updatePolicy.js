/**
 * Over-the-air update policy (finding SC-31).
 *
 * expo-updates used to download and run any JavaScript bundle published to the EAS project,
 * unsigned, so whoever held the EAS token could change the installed app without a review or a
 * store release. OTA is now OFF unless the update is code-signed:
 *
 *   - If an update-signing certificate is present (OLMIES_UPDATES_CERT, default
 *     certs/certificate.pem), updates are enabled and the app accepts only bundles signed by the
 *     matching private key. The private key is never committed (keys/ is git-ignored); it stays
 *     with the release approver (UTech decision).
 *   - Without a certificate, updates are disabled. A non-production build may opt in to
 *     unsigned updates for internal testing with OLMIES_ALLOW_UNSIGNED_UPDATES=true; a
 *     production build never can.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_CERT = 'certs/certificate.pem';

function resolveUpdates(baseUpdates, env = process.env, projectRoot = path.join(__dirname, '..', '..'), exists = fs.existsSync) {
  const base = { ...(baseUpdates || {}) };
  const certRelative = env.OLMIES_UPDATES_CERT || DEFAULT_CERT;
  const isProduction = (env.EAS_BUILD_PROFILE || '').toLowerCase() === 'production';

  if (exists(path.resolve(projectRoot, certRelative))) {
    return {
      ...base,
      enabled: true,
      codeSigningCertificate: `./${certRelative.replace(/^\.\//, '')}`,
      codeSigningMetadata: { keyid: 'main', alg: 'rsa-v1_5-sha256' },
    };
  }

  if (!isProduction && env.OLMIES_ALLOW_UNSIGNED_UPDATES === 'true') {
    return { ...base, enabled: true };
  }

  const { codeSigningCertificate, codeSigningMetadata, ...rest } = base;
  return { ...rest, enabled: false, checkAutomatically: 'NEVER' };
}

function isSafeUpdatesConfig(updates) {
  if (!updates || updates.enabled === false) return true;
  return Boolean(updates.codeSigningCertificate && updates.codeSigningMetadata);
}

module.exports = { resolveUpdates, isSafeUpdatesConfig, DEFAULT_CERT };
