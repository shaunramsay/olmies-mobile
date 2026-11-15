/**
 * Mobile API destination policy (finding PROV-07, mobile counterpart of the portal policy).
 *
 * The app sends passwords, Entra ID tokens, refresh tokens and access tokens to the API base URL.
 * That URL used to be accepted from EXPO_PUBLIC_API_URL without any check, so a build could be
 * pointed at a retired, unowned or plain-HTTP host (the legacy olmies-ai-production.up.railway.app
 * name is unassigned on Railway and could be registered by anyone). Release builds now accept only
 * an HTTPS origin listed in apiDestinationApprovals.json, a reviewed file in source control. An
 * environment variable can choose an approved destination but can never approve one.
 *
 * Development builds (Expo Go / __DEV__) may also use loopback or private-LAN HTTP, or a developer HTTPS
 * tunnel, for a local API. The retired host is refused everywhere.
 *
 * This module is CommonJS and dependency-free so that app.config.js (Node, at build time), the app
 * (runtime) and node --test can all use the same rules.
 */
const approvalsDocument = require('./apiDestinationApprovals.json');

const RETIRED_HOSTS = new Set(['olmies-ai-production.up.railway.app']);

const isPrivateOrLoopbackHost = (hostname) => {
  if (hostname === 'localhost' || hostname === '10.0.2.2') return true;
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return false;
  const [a, b] = octets;
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
};

const loadApprovedOrigins = (document = approvalsDocument) => {
  if (!document || document.version !== 1 || !Array.isArray(document.approvals)) {
    throw new Error('apiDestinationApprovals.json is malformed.');
  }
  const origins = new Set();
  for (const entry of document.approvals) {
    const origin = entry && entry.apiOrigin;
    if (typeof origin !== 'string' || !entry.approvalRef || typeof entry.approvalRef !== 'string') {
      throw new Error('Every API destination approval needs apiOrigin and approvalRef.');
    }
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('An approved API destination is not a valid URL.');
    }
    if (parsed.protocol !== 'https:' || parsed.origin !== origin || RETIRED_HOSTS.has(parsed.hostname)) {
      throw new Error('Approved API destinations must be canonical HTTPS origins that are not retired.');
    }
    if (origins.has(origin)) throw new Error('Duplicate API destination approval.');
    origins.add(origin);
  }
  return origins;
};

const normalize = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';
  return trimmed.replace(/\/+$/, '');
};

/**
 * Decides whether a configured API base URL may receive credentials.
 * Returns { ok: true, baseUrl } or { ok: false, baseUrl: '', reason }. The reason never contains
 * the URL's user-info, so it is safe to log or display.
 */
const evaluateApiBaseUrl = (value, { release, approvedOrigins } = {}) => {
  const approved = approvedOrigins || loadApprovedOrigins();
  const candidate = normalize(value);
  if (!candidate) {
    return release
      ? { ok: false, baseUrl: '', reason: 'EXPO_PUBLIC_API_URL must be set to an approved API destination for release builds.' }
      : { ok: true, baseUrl: '' };
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, baseUrl: '', reason: 'The configured API destination is not a valid absolute URL.' };
  }
  if (url.username || url.password) {
    return { ok: false, baseUrl: '', reason: 'The configured API destination must not contain credentials.' };
  }
  if (url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    return { ok: false, baseUrl: '', reason: 'The configured API destination must be an origin without a path, query or fragment.' };
  }
  if (RETIRED_HOSTS.has(url.hostname)) {
    return { ok: false, baseUrl: '', reason: `The API destination ${url.hostname} is retired and must not be used.` };
  }
  if (url.protocol === 'https:' && approved.has(url.origin)) {
    return { ok: true, baseUrl: url.origin };
  }
  if (!release && url.protocol === 'http:' && isPrivateOrLoopbackHost(url.hostname)) {
    return { ok: true, baseUrl: url.origin };
  }
  // Development builds (never distributed) keep developer HTTPS tunnels to a local API working.
  if (!release && url.protocol === 'https:') {
    return { ok: true, baseUrl: url.origin };
  }
  return {
    ok: false,
    baseUrl: '',
    reason: `The API destination ${url.host} is not approved. Add it to src/config/apiDestinationApprovals.json through a reviewed change.`,
  };
};

/**
 * Builds the URL for an API request. Relative paths are joined to the approved base. Absolute URLs
 * are allowed only when they stay on the same origin under /api/, so a caller cannot send a token
 * to another host by passing a full URL.
 */
const resolveApiRequestUrl = (baseUrl, path) => {
  if (!baseUrl) {
    throw new Error('The API destination is not configured or not approved for this build.');
  }
  if (typeof path !== 'string' || !path) {
    throw new Error('An API path is required.');
  }
  const base = new URL(baseUrl);
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) {
    const target = new URL(path, base);
    if (target.origin !== base.origin || !target.pathname.startsWith('/api/') || target.username || target.password) {
      throw new Error('Refused an API request to a destination other than the approved API.');
    }
    return target.toString();
  }
  const relative = path.startsWith('/') ? path : `/${path}`;
  const target = new URL(relative, base);
  if (target.origin !== base.origin) {
    throw new Error('Refused an API request to a destination other than the approved API.');
  }
  return `${base.origin}${relative}`;
};

/** True when Expo config is being evaluated for an EAS build (preview or production). */
const isReleaseBuildEnvironment = (env = process.env) => {
  const profile = (env.EAS_BUILD_PROFILE || '').trim();
  return env.EAS_BUILD === 'true' || env.OLMIES_ENFORCE_API_DESTINATION === 'true'
    ? profile !== 'development'
    : false;
};

module.exports = {
  RETIRED_HOSTS,
  loadApprovedOrigins,
  evaluateApiBaseUrl,
  resolveApiRequestUrl,
  isReleaseBuildEnvironment,
};
