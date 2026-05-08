import API_BASE_URL from './api';

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const BACKEND_DIRECTIONS_PATH = '/api/v1/mobile/map/directions';
const runtimeGlobal = globalThis;

const getOriginalFetch = () => {
  if (typeof runtimeGlobal.fetch !== 'function') {
    return null;
  }

  if (!runtimeGlobal.__olmiesOriginalFetch) {
    runtimeGlobal.__olmiesOriginalFetch = runtimeGlobal.fetch.bind(runtimeGlobal);
  }

  return runtimeGlobal.__olmiesOriginalFetch;
};

const isGoogleDirectionsRequest = (url) => (
  typeof url === 'string'
  && url.startsWith(GOOGLE_DIRECTIONS_URL)
);

const buildBackendDirectionsUrl = () => {
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  if (!baseUrl) return '';

  if (baseUrl.endsWith('/api/v1')) {
    return `${baseUrl}/mobile/map/directions`;
  }

  return `${baseUrl}${BACKEND_DIRECTIONS_PATH}`;
};

const getQueryParam = (url, paramName) => {
  const queryString = url.split('?')[1] || '';
  const pairs = queryString.split('&').filter(Boolean);

  for (const pair of pairs) {
    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    if (key === paramName) {
      return decodeURIComponent(rawValue.replace(/\+/g, ' '));
    }
  }

  return null;
};

const parseLatLng = (value) => {
  if (!value) return null;

  const [latValue, lngValue] = value.split(',');
  const latitude = Number.parseFloat(latValue);
  const longitude = Number.parseFloat(lngValue);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const createJsonResponse = (payload) => {
  const body = JSON.stringify(payload);

  if (typeof Response !== 'undefined') {
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => body,
    headers: { get: () => 'application/json' },
  };
};

const parseBackendErrorPayload = (status, body) => {
  try {
    const payload = JSON.parse(body);
    if (payload?.status) return payload;
  } catch (error) {
    // Fall through to a compact backend status payload.
  }

  return {
    status: 'BACKEND_ERROR',
    error_message: body || `Backend route request failed with HTTP ${status}.`,
    routes: [],
  };
};

export const installGoogleDirectionsProxy = (getToken = () => null) => {
  runtimeGlobal.__olmiesDirectionsProxyGetToken = getToken;

  if (runtimeGlobal.__olmiesDirectionsProxyInstalled) {
    return;
  }

  const originalFetch = getOriginalFetch();
  if (!originalFetch) {
    console.warn('[CampusMap] Directions proxy skipped: global fetch is unavailable.');
    return;
  }

  const backendDirectionsUrl = buildBackendDirectionsUrl();
  console.info('[CampusMap] Google Directions proxy installed.', {
    hasApiBaseUrl: Boolean(API_BASE_URL),
    backendDirectionsUrl,
  });

  runtimeGlobal.fetch = async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;

    if (isGoogleDirectionsRequest(requestUrl)) {
      const origin = parseLatLng(getQueryParam(requestUrl, 'origin'));
      const destination = parseLatLng(getQueryParam(requestUrl, 'destination'));
      const mode = getQueryParam(requestUrl, 'mode') || 'walking';

      if (!backendDirectionsUrl) {
        console.warn('[CampusMap] Directions proxy skipped: API base URL is not configured.');
        return createJsonResponse({
          status: 'CONFIGURATION_ERROR',
          error_message: 'Mobile API base URL is not configured.',
          routes: [],
        });
      }

      if (!origin || !destination) {
        console.warn('[CampusMap] Directions proxy rejected malformed coordinates.', { mode });
        return createJsonResponse({
          status: 'INVALID_REQUEST',
          error_message: 'Origin and destination coordinates are invalid.',
          routes: [],
        });
      }

      console.info('[CampusMap] Routing directions request through backend.', {
        backendDirectionsUrl,
        mode,
        origin,
        destination,
      });

      try {
        const token = runtimeGlobal.__olmiesDirectionsProxyGetToken?.();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const backendResponse = await originalFetch(backendDirectionsUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ origin, destination, mode }),
        });

        if (!backendResponse.ok) {
          const body = await backendResponse.text().catch(() => '');
          const payload = parseBackendErrorPayload(backendResponse.status, body);
          console.warn('[CampusMap] Backend directions route failed.', {
            status: backendResponse.status,
            routeStatus: payload.status,
            errorMessage: payload.error_message,
          });
          return createJsonResponse(payload);
        }

        if (typeof backendResponse.clone === 'function') {
          backendResponse.clone().json()
            .then((payload) => {
              console.info('[CampusMap] Backend directions route returned.', {
                routeStatus: payload?.status,
                errorMessage: payload?.error_message,
                routeCount: payload?.routes?.length || 0,
              });
            })
            .catch(() => {});
        }

        return backendResponse;
      } catch (error) {
        console.warn('[CampusMap] Backend directions route request failed.', error);
        return createJsonResponse({
          status: 'BACKEND_ERROR',
          error_message: error?.message || 'The mobile API route request failed.',
          routes: [],
        });
      }
    }

    return originalFetch(input, init);
  };

  runtimeGlobal.__olmiesDirectionsProxyInstalled = true;
};
