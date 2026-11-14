const { isTokenExpiredOrInvalid, isTokenExpiringSoon } = require('./authTokenUtils');

const readJsonSafe = async (response) => {
  const rawText = await response.text().catch(() => '');
  if (!rawText) return {};
  return JSON.parse(rawText);
};

const isFormDataBody = (body) => {
  return typeof FormData !== 'undefined' && body instanceof FormData;
};

const buildAuthenticatedHeaders = (headers, token, body) => {
  const nextHeaders = { ...(headers || {}) };

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  if (isFormDataBody(body)) {
    delete nextHeaders['Content-Type'];
  } else if (!nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  return nextHeaders;
};

// A refresh the server could not complete for reasons that say nothing about the account (an ISAS
// outage answers 503 academic_record_unavailable; any 5xx; no network) must not sign the user out:
// the server deliberately keeps the session. Only an answer about the session itself (400/401/403,
// or a malformed success) ends it locally.
const keepsSessionAfterFailedRefresh = (status) => typeof status !== 'number' || status >= 500;

const createMobileAuthSession = ({
  tokenStorage,
  tokenKey,
  refreshTokenKey,
  buildApiUrl,
  fetchImpl,
  getAccessToken,
  setAccessToken,
  setUser,
  decodeAndSetUser,
  getDeviceId,
  logger = console,
  refreshLeadSeconds = 5 * 60,
}) => {
  let refreshPromise = null;

  const clearLocalAuth = async () => {
    await tokenStorage.deleteItemAsync(tokenKey);
    await tokenStorage.deleteItemAsync(refreshTokenKey);
    setAccessToken(null);
    setUser(null);
  };

  const revokeRefreshToken = async (refreshToken) => {
    if (!refreshToken) return;

    try {
      await fetchImpl(buildApiUrl('/api/v1/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      logger.warn('Unable to revoke mobile refresh token during logout:', error);
    }
  };

  const login = async (newToken, userData = null, newRefreshToken = null) => {
    await tokenStorage.setItemAsync(tokenKey, newToken);

    if (newRefreshToken) {
      await tokenStorage.setItemAsync(refreshTokenKey, newRefreshToken);
    }

    setAccessToken(newToken);
    return decodeAndSetUser(newToken, userData);
  };

  const logout = async ({ revoke = true } = {}) => {
    const storedRefreshToken = await tokenStorage.getItemAsync(refreshTokenKey);

    if (revoke) {
      await revokeRefreshToken(storedRefreshToken);
    }

    await clearLocalAuth();
  };

  const refreshAccessToken = async (accessToken = null) => {
    const currentToken = accessToken || getAccessToken();
    const refreshToken = await tokenStorage.getItemAsync(refreshTokenKey);

    if (!currentToken || !refreshToken) {
      await clearLocalAuth();
      return null;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const requestBody = {
          token: currentToken,
          refreshToken,
        };

        if (getDeviceId) {
          requestBody.deviceId = await getDeviceId();
        }

        const response = await fetchImpl(buildApiUrl('/api/v1/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          if (keepsSessionAfterFailedRefresh(response.status)) {
            logger.warn('Mobile token refresh is temporarily unavailable; keeping the session.', { status: response.status });
            return null;
          }
          await clearLocalAuth();
          return null;
        }

        const data = await readJsonSafe(response);
        if (!data.token || !data.refreshToken) {
          await clearLocalAuth();
          return null;
        }

        const user = await login(data.token, data.user, data.refreshToken);
        return {
          token: data.token,
          refreshToken: data.refreshToken,
          user,
        };
      } catch (error) {
        // Network failure: nothing is known about the session, so keep it.
        logger.warn('Mobile token refresh failed; keeping the session:', error);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const fetchWithAuth = async (url, options = {}) => {
    const fullUrl = buildApiUrl(url);
    let currentToken = getAccessToken();

    if (currentToken && isTokenExpiringSoon(currentToken, refreshLeadSeconds)) {
      const refreshedSession = await refreshAccessToken(currentToken);
      currentToken = refreshedSession?.token || getAccessToken();
    }

    const send = async (token) => {
      const headers = buildAuthenticatedHeaders(options.headers, token, options.body);
      return fetchImpl(fullUrl, { ...options, headers });
    };

    const response = await send(currentToken);

    if (response.status === 401 && currentToken) {
      const refreshedSession = await refreshAccessToken(currentToken);

      if (refreshedSession?.token) {
        return send(refreshedSession.token);
      }

      if (!isTokenExpiredOrInvalid(currentToken)) {
        logger.warn('Authenticated request returned 401 and token refresh failed; auth state was cleared.', {
          url: fullUrl,
          status: response.status,
        });
      }
    }

    return response;
  };

  return {
    login,
    logout,
    refreshAccessToken,
    fetchWithAuth,
  };
};

module.exports = {
  keepsSessionAfterFailedRefresh,
  buildAuthenticatedHeaders,
  createMobileAuthSession,
  readJsonSafe,
};
