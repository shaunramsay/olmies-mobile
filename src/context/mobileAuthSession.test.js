const test = require('node:test');
const assert = require('node:assert/strict');
const { createMobileAuthSession } = require('./mobileAuthSession');

const base64Url = (value) => {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const makeJwt = (expiresInSeconds) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({ sub: 'student-1', username: 'student-1', role: 'student', exp: nowSeconds + expiresInSeconds }),
    'signature',
  ].join('.');
};

const createStorage = () => {
  const values = new Map();

  return {
    values,
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      values.set(key, value);
    },
    deleteItemAsync: async (key) => {
      values.delete(key);
    },
  };
};

const createResponse = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const createSessionHarness = (fetchImpl) => {
  const storage = createStorage();
  let accessToken = null;
  let user = null;

  const session = createMobileAuthSession({
    tokenStorage: storage,
    tokenKey: 'access',
    refreshTokenKey: 'refresh',
    buildApiUrl: (path) => `https://api.test${path}`,
    fetchImpl,
    getAccessToken: () => accessToken,
    setAccessToken: (nextToken) => {
      accessToken = nextToken;
    },
    setUser: (nextUser) => {
      user = nextUser;
    },
    decodeAndSetUser: (_token, userData) => {
      user = userData || { username: 'student-1', role: 'Student' };
      return user;
    },
    getDeviceId: async () => 'device-1',
    logger: { warn: () => {} },
  });

  return {
    session,
    storage,
    get accessToken() {
      return accessToken;
    },
    get user() {
      return user;
    },
  };
};

test('login stores access and refresh tokens for mobile sessions', async () => {
  const harness = createSessionHarness(async () => createResponse(200));
  const token = makeJwt(7200);

  await harness.session.login(token, { username: 'student-1', role: 'Student' }, 'refresh-1');

  assert.equal(await harness.storage.getItemAsync('access'), token);
  assert.equal(await harness.storage.getItemAsync('refresh'), 'refresh-1');
  assert.equal(harness.accessToken, token);
  assert.deepEqual(harness.user, { username: 'student-1', role: 'Student' });
});

test('refresh stores rotated refresh token returned by the API', async () => {
  const oldToken = makeJwt(60);
  const newToken = makeJwt(7200);
  const calls = [];
  const harness = createSessionHarness(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return createResponse(200, {
      token: newToken,
      refreshToken: 'refresh-2',
      user: { username: 'student-1', role: 'Student' },
    });
  });

  await harness.session.login(oldToken, { username: 'student-1', role: 'Student' }, 'refresh-1');
  const refreshed = await harness.session.refreshAccessToken(oldToken);

  assert.equal(calls[0].url, 'https://api.test/api/v1/auth/refresh');
  assert.equal(calls[0].body.refreshToken, 'refresh-1');
  assert.equal(refreshed.token, newToken);
  assert.equal(await harness.storage.getItemAsync('access'), newToken);
  assert.equal(await harness.storage.getItemAsync('refresh'), 'refresh-2');
});

test('logout revokes refresh token and clears local auth state', async () => {
  const calls = [];
  const harness = createSessionHarness(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return createResponse(204);
  });

  await harness.session.login(makeJwt(7200), { username: 'student-1', role: 'Student' }, 'refresh-1');
  await harness.session.logout();

  assert.equal(calls[0].url, 'https://api.test/api/v1/auth/logout');
  assert.equal(calls[0].body.refreshToken, 'refresh-1');
  assert.equal(await harness.storage.getItemAsync('access'), null);
  assert.equal(await harness.storage.getItemAsync('refresh'), null);
  assert.equal(harness.accessToken, null);
  assert.equal(harness.user, null);
});

test('expired refresh token response clears local auth state', async () => {
  const harness = createSessionHarness(async () => createResponse(401, { error: 'expired refresh token' }));

  await harness.session.login(makeJwt(-1), { username: 'student-1', role: 'Student' }, 'refresh-1');
  const refreshed = await harness.session.refreshAccessToken();

  assert.equal(refreshed, null);
  assert.equal(await harness.storage.getItemAsync('access'), null);
  assert.equal(await harness.storage.getItemAsync('refresh'), null);
  assert.equal(harness.accessToken, null);
});

test('invalid refresh token response clears local auth state', async () => {
  const harness = createSessionHarness(async () => createResponse(401, { error: 'invalid refresh token' }));

  await harness.session.login(makeJwt(7200), { username: 'student-1', role: 'Student' }, 'invalid-refresh');
  const refreshed = await harness.session.refreshAccessToken();

  assert.equal(refreshed, null);
  assert.equal(await harness.storage.getItemAsync('access'), null);
  assert.equal(await harness.storage.getItemAsync('refresh'), null);
});

test('fetchWithAuth silently refreshes before expiry and sends the new bearer token', async () => {
  const oldToken = makeJwt(60);
  const newToken = makeJwt(7200);
  const calls = [];
  const harness = createSessionHarness(async (url, options) => {
    calls.push({ url, headers: options.headers, body: options.body });

    if (url.endsWith('/api/v1/auth/refresh')) {
      return createResponse(200, {
        token: newToken,
        refreshToken: 'refresh-2',
        user: { username: 'student-1', role: 'Student' },
      });
    }

    return createResponse(200, { ok: true });
  });

  await harness.session.login(oldToken, { username: 'student-1', role: 'Student' }, 'refresh-1');
  const response = await harness.session.fetchWithAuth('/api/v1/mobile/open-surveys');

  assert.equal(response.status, 200);
  assert.equal(calls[0].url, 'https://api.test/api/v1/auth/refresh');
  assert.equal(calls[1].url, 'https://api.test/api/v1/mobile/open-surveys');
  assert.equal(calls[1].headers.Authorization, `Bearer ${newToken}`);
});

test('fetchWithAuth refreshes after a valid-token 401 and retries once', async () => {
  const oldToken = makeJwt(7200);
  const newToken = makeJwt(7200);
  const calls = [];
  const harness = createSessionHarness(async (url, options) => {
    calls.push({ url, headers: options.headers, body: options.body });

    if (url.endsWith('/api/v1/auth/refresh')) {
      return createResponse(200, {
        token: newToken,
        refreshToken: 'refresh-2',
        user: { username: 'student-1', role: 'Student' },
      });
    }

    return calls.filter((call) => call.url.endsWith('/api/v1/mobile/modules')).length === 1
      ? createResponse(401, { error: 'stale token' })
      : createResponse(200, { ok: true });
  });

  await harness.session.login(oldToken, { username: 'student-1', role: 'Student' }, 'refresh-1');
  const response = await harness.session.fetchWithAuth('/api/v1/mobile/modules');

  assert.equal(response.status, 200);
  assert.equal(calls[0].headers.Authorization, `Bearer ${oldToken}`);
  assert.equal(calls[1].url, 'https://api.test/api/v1/auth/refresh');
  assert.equal(calls[2].headers.Authorization, `Bearer ${newToken}`);
});
